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

    public List<ClothingItem> getRankedFeed(Long userId, String campus, String size) {
        List<ClothingItem> allItems = itemRepo.findByCampusAndUserIdNot(campus, userId);

        Set<Long> swipedItemIds = swipeRepo.findByUserIdFrom(userId).stream()
        .map(SwipeLedger::getItemIdTo)
        .collect(Collectors.toSet());

        // FIX: Calculate user vector ONCE outside the loop to stop lag
        Map<String, Double> userVector = buildUserVector(userId);

        return allItems.stream()
            .filter(ClothingItem::isActive) // FIX: Ignore items that have been swapped
            .filter(item -> !swipedItemIds.contains(item.getId()))
            .sorted((a, b) -> Double.compare(
                    cosineSimilarity(userVector, buildItemVector(b)),
                    cosineSimilarity(userVector, buildItemVector(a))
            ))
            .collect(Collectors.toList());
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
