package com.clothingswap.service;

import com.clothingswap.model.ClothingItem;
import com.clothingswap.model.SwipeLedger;
import com.clothingswap.repository.ClothingItemRepository;
import com.clothingswap.repository.SwipeLedgerRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final ClothingItemRepository itemRepo;
    private final SwipeLedgerRepository swipeRepo;

    public RecommendationService(ClothingItemRepository itemRepo, SwipeLedgerRepository swipeRepo) {
        this.itemRepo = itemRepo;
        this.swipeRepo = swipeRepo;
    }

    public List<ClothingItem> getRankedFeed(
            Long userId,
            String campus,
            String size,
            String gender,
            String type,
            String color,
            String style
    ) {
        List<ClothingItem> allItems = itemRepo.findByCampusAndUserIdNot(campus, userId);

        Set<Long> swipedItemIds = swipeRepo.findByUserIdFrom(userId).stream()
        .filter(swipe -> !"REJECTED".equalsIgnoreCase(swipe.getAction()))
        .map(SwipeLedger::getItemIdTo)
        .collect(Collectors.toSet());

        // FIX: Calculate user vector ONCE outside the loop to stop lag
        Map<String, Double> userVector = buildUserVector(userId);

        List<ClothingItem> candidates = allItems.stream()
            .filter(ClothingItem::isActive) // FIX: Ignore items that have been swapped
            .filter(item -> !swipedItemIds.contains(item.getId()))
            .filter(item -> matchesFilters(item, gender, type, size, color, style))
            .collect(Collectors.toList());

        Map<ClothingItem, Double> rawByItem = new IdentityHashMap<>();
        double maxRaw = 0.0;
        for (ClothingItem item : candidates) {
            double raw = cosineSimilarity(userVector, buildItemVector(item));
            rawByItem.put(item, raw);
            maxRaw = Math.max(maxRaw, raw);
        }

        for (ClothingItem item : candidates) {
            double raw = rawByItem.getOrDefault(item, 0.0);
            double normalized = maxRaw > 0 ? (raw / maxRaw) : 0.0;

            // Calibrated "match %" for UX:
            // - keeps ordering from similarity
            // - avoids showing almost all cards under 50%
            double calibratedBase = 0.28 + (normalized * 0.62); // 28%..90%
            double score = Math.max(0.12, Math.min(0.99, calibratedBase + conditionBonus(item.getCondition())));
            item.setMatchScore(round3(score));
        }

        return candidates.stream()
            .sorted((a, b) -> Double.compare(
                    b.getMatchScore() != null ? b.getMatchScore() : 0.0,
                    a.getMatchScore() != null ? a.getMatchScore() : 0.0
            ))
            .collect(Collectors.toList());
    }

    private double conditionBonus(String condition) {
        if (condition == null || condition.isBlank()) return 0.0;
        return switch (condition.trim().toUpperCase()) {
            case "NEW" -> 0.05;
            case "GOOD" -> 0.02;
            case "FAIR" -> 0.0;
            default -> -0.02;
        };
    }

    private double round3(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }

    private boolean matchesFilters(
            ClothingItem item,
            String gender,
            String type,
            String size,
            String color,
            String style
    ) {
        if (gender != null && !gender.isBlank()) {
            String effectiveGender = item.getGender();
            if (isBlank(effectiveGender)) {
                effectiveGender = inferLegacyGender(item.getCategory());
            }
            if (!equalsIgnoreCase(effectiveGender, gender)) return false;
        }

        if (type != null && !type.isBlank()) {
            String effectiveType = item.getClothingType();
            if (effectiveType == null || effectiveType.isBlank()) {
                effectiveType = mapLegacyCategoryToType(item.getCategory());
            }
            if (!equalsIgnoreCase(effectiveType, type)) return false;
        }

        if (size != null && !size.isBlank()) {
            if (!equalsIgnoreCase(item.getSize(), size)) return false;
        }

        if (color != null && !color.isBlank()) {
            boolean matchColor = equalsIgnoreCase(item.getColor(), color)
                    || containsToken(item.getColorTags(), color);
            if (!matchColor) return false;
        }

        if (style != null && !style.isBlank()) {
            if (!matchesStyle(item, style)) return false;
        }

        return true;
    }

    private boolean matchesStyle(ClothingItem item, String requestedStyle) {
        String normalizedRequested = normalizeStyle(requestedStyle);
        if (isBlank(normalizedRequested)) return true;

        if (equalsIgnoreCase(normalizeStyle(item.getStyle()), normalizedRequested)) return true;
        if (containsToken(item.getStyleTags(), normalizedRequested)) return true;
        return containsCanonicalStyleToken(item.getStyleTags(), normalizedRequested);
    }

    private boolean equalsIgnoreCase(String a, String b) {
        return a != null && b != null && a.trim().equalsIgnoreCase(b.trim());
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean containsToken(String csv, String token) {
        if (csv == null || csv.isBlank() || token == null || token.isBlank()) return false;
        String target = token.trim().toLowerCase();
        for (String part : csv.split(",")) {
            if (part.trim().equalsIgnoreCase(target)) {
                return true;
            }
        }
        return false;
    }

    private String mapLegacyCategoryToType(String category) {
        if (category == null) return null;
        return switch (category.trim().toUpperCase()) {
            case "TSHIRT", "T-SHIRT", "SWEATER", "DRESS" -> "TOPS";
            case "JEANS", "SKIRT", "SHORTS" -> "BOTTOMS";
            case "JACKET" -> "OUTERWEAR";
            case "SHOES" -> "FOOTWEAR";
            default -> "ACCESSORIES";
        };
    }

    private String inferLegacyGender(String category) {
        if (category == null) return null;
        return switch (category.trim().toUpperCase()) {
            case "DRESS", "SKIRT" -> "WOMEN";
            default -> "MEN";
        };
    }

    private boolean containsCanonicalStyleToken(String csv, String requestedStyle) {
        if (csv == null || csv.isBlank()) return false;
        for (String part : csv.split(",")) {
            if (equalsIgnoreCase(normalizeStyle(part), requestedStyle)) {
                return true;
            }
        }
        return false;
    }

    private String normalizeStyle(String raw) {
        if (raw == null) return null;
        String token = raw.trim().toUpperCase();
        if (token.isEmpty()) return null;

        return switch (token) {
            case "ACTIVE", "SPORTY", "ATHLETIC", "ATHLEISURE", "GYM" -> "ACTIVE";
            case "STREET", "STREETWEAR", "CASUAL", "MINIMALIST", "BOHEMIAN", "PREPPY" -> "STREET";
            case "FORMAL", "BUSINESS", "SMART" -> "FORMAL";
            case "VINTAGE", "RETRO" -> "VINTAGE";
            default -> token;
        };
    }

    private Map<String, Double> buildUserVector(Long userId) {
        Map<String, Double> vector = new HashMap<>();

        List<ClothingItem> ownItems = itemRepo.findByUserId(userId);
        for (ClothingItem item : ownItems) {
            addTagsToVector(vector, item.getColorTags());
            addTagsToVector(vector, item.getStyleTags());
        }

        List<SwipeLedger> rightSwipes = swipeRepo.findByUserIdFromAndAction(userId, "RIGHT");
        for (SwipeLedger swipe : rightSwipes) {
            itemRepo.findById(swipe.getItemIdTo()).ifPresent(item -> {
                addTagsToVector(vector, item.getColorTags());
                addTagsToVector(vector, item.getStyleTags());
            });
        }

        return vector;
    }

    private void addTagsToVector(Map<String, Double> vector, String tags) {
        if (tags == null || tags.isBlank()) return;
        for (String tag : tags.split(",")) {
            String t = tag.trim().toLowerCase();
            if (!t.isEmpty()) {
                vector.merge(t, 1.0, Double::sum);
            }
        }
    }

    private Map<String, Double> buildItemVector(ClothingItem item) {
        Map<String, Double> vector = new HashMap<>();
        addTagsToVector(vector, item.getColorTags());
        addTagsToVector(vector, item.getStyleTags());
        if (item.getCategory() != null) vector.put(item.getCategory().toLowerCase(), 2.0);
        if (item.getCondition() != null) vector.put(item.getCondition().toLowerCase(), 1.0);
        return vector;
    }

    private double cosineSimilarity(Map<String, Double> a, Map<String, Double> b) {
        if (a.isEmpty() || b.isEmpty()) return 0.0;

        double dot = 0.0;
        for (Map.Entry<String, Double> entry : a.entrySet()) {
            dot += entry.getValue() * b.getOrDefault(entry.getKey(), 0.0);
        }

        double normA = Math.sqrt(a.values().stream().mapToDouble(v -> v * v).sum());
        double normB = Math.sqrt(b.values().stream().mapToDouble(v -> v * v).sum());

        if (normA == 0 || normB == 0) return 0.0;
        return dot / (normA * normB);
    }
}
