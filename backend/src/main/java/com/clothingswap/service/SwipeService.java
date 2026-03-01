package com.clothingswap.service;

import com.clothingswap.model.ClothingItem;
import com.clothingswap.model.SwipeLedger;
import com.clothingswap.repository.ClothingItemRepository;
import com.clothingswap.repository.SwipeLedgerRepository;
import com.clothingswap.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
public class SwipeService {

    private final SwipeLedgerRepository swipeRepo;
    private final ClothingItemRepository itemRepo;
    private final UserRepository userRepo;
    private final LcaService lcaService;

    public SwipeService(SwipeLedgerRepository swipeRepo, ClothingItemRepository itemRepo,
                        UserRepository userRepo, LcaService lcaService) {
        this.swipeRepo = swipeRepo;
        this.itemRepo = itemRepo;
        this.userRepo = userRepo;
        this.lcaService = lcaService;
    }

    public Map<String, Object> recordSwipe(Long userIdFrom, Long itemIdTo, String action) {
        Optional<SwipeLedger> existing = swipeRepo.findByUserIdFromAndItemIdTo(userIdFrom, itemIdTo);

        SwipeLedger swipe;
        if (existing.isPresent()) {
            swipe = existing.get();
            swipe.setAction(action);
        } else {
            swipe = new SwipeLedger();
            swipe.setUserIdFrom(userIdFrom);
            swipe.setItemIdTo(itemIdTo);
            swipe.setAction(action);
        }
        swipeRepo.save(swipe);

        Map<String, Object> result = new HashMap<>();
        result.put("recorded", true);

        if ("RIGHT".equals(action)) {
            boolean matched = checkForMatch(userIdFrom, itemIdTo);
            result.put("matched", matched);
        } else {
            result.put("matched", false);
        }

        return result;
    }

    private Map<String, Object> buildConfirmResult(boolean recorded, String message, double waterSaved, double co2Saved) {
        double milesNotDriven = co2Saved / 0.404;
        return Map.of(
                "recorded", recorded,
                "message", message,
                "waterSaved", round2(Math.max(0, waterSaved)),
                "co2Saved", round2(Math.max(0, co2Saved)),
                "milesNotDriven", round2(Math.max(0, milesNotDriven))
        );
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private boolean checkForMatch(Long userIdFrom, Long itemIdTo) {
        Optional<ClothingItem> targetItem = itemRepo.findById(itemIdTo);
        // Ensure the item is still active
        if (targetItem.isEmpty() || !targetItem.get().isActive()) return false;

        Long targetUserId = targetItem.get().getUserId();
        List<ClothingItem> userAItems = itemRepo.findByUserId(userIdFrom);
        if (userAItems.isEmpty()) return false;

        List<SwipeLedger> targetUserRightSwipes = swipeRepo.findByUserIdFromAndAction(targetUserId, "RIGHT");
        Set<Long> userAItemIds = userAItems.stream().map(ClothingItem::getId).collect(Collectors.toSet());

        return targetUserRightSwipes.stream()
            .anyMatch(s -> userAItemIds.contains(s.getItemIdTo()) && !s.isConfirmed());
    }

    @Transactional
    public Map<String, Object> confirmSwap(Long userIdFrom, Long itemIdTo, Long ownItemId) {
        Optional<ClothingItem> itemBOpt = itemRepo.findById(itemIdTo);
        if (itemBOpt.isEmpty() || !itemBOpt.get().isActive()) {
            return buildConfirmResult(false, "Swap confirmation did not change impact (already confirmed or no valid pair)", 0, 0);
        }
        ClothingItem itemB = itemBOpt.get();
        Long userIdTo = itemB.getUserId();

        Optional<SwipeLedger> forwardSwipeOpt = swipeRepo.findByUserIdFromAndItemIdTo(userIdFrom, itemIdTo);
        if (forwardSwipeOpt.isEmpty() || !"RIGHT".equals(forwardSwipeOpt.get().getAction())) {
            return buildConfirmResult(false, "Swap confirmation did not change impact (already confirmed or no valid pair)", 0, 0);
        }
        
        SwipeLedger forwardSwipe = forwardSwipeOpt.get();
        if (forwardSwipe.isConfirmed()) {
            return buildConfirmResult(false, "Swap confirmation did not change impact (already confirmed or no valid pair)", 0, 0);
        }

        List<ClothingItem> userAItems = itemRepo.findByUserId(userIdFrom).stream()
                .filter(ClothingItem::isActive)
                .collect(Collectors.toList());
        Set<Long> userAItemIds = userAItems.stream().map(ClothingItem::getId).collect(Collectors.toSet());
        if (ownItemId != null && !userAItemIds.contains(ownItemId)) {
            return buildConfirmResult(false, "Swap confirmation did not change impact (already confirmed or no valid pair)", 0, 0);
        }
        
        Optional<SwipeLedger> reverseSwipeOpt = swipeRepo.findByUserIdFromAndAction(userIdTo, "RIGHT")
                .stream()
                .filter(s -> userAItemIds.contains(s.getItemIdTo()) && !s.isConfirmed())
                .filter(s -> ownItemId == null || Objects.equals(s.getItemIdTo(), ownItemId))
                .findFirst();

        if (reverseSwipeOpt.isEmpty()) {
            return buildConfirmResult(false, "Swap confirmation did not change impact (already confirmed or no valid pair)", 0, 0);
        }
        SwipeLedger reverseSwipe = reverseSwipeOpt.get();

        double totalWater = 0.0;
        double totalCo2 = 0.0;

        // 1. Mark Items as Inactive (Removes from feed and matches)
        itemB.setActive(false);
        itemRepo.save(itemB);

        Optional<ClothingItem> itemAOpt = itemRepo.findById(reverseSwipe.getItemIdTo());
        if (itemAOpt.isPresent()) {
            ClothingItem itemA = itemAOpt.get();
            itemA.setActive(false);
            itemRepo.save(itemA);

            // Calculate Savings
            LcaService.LcaResult lcaItemB = lcaService.calculateSavings(itemB.getCategory(), itemB.getClothingType());
            LcaService.LcaResult lcaItemA = lcaService.calculateSavings(itemA.getCategory(), itemA.getClothingType());
            totalWater = lcaItemA.waterSaved() + lcaItemB.waterSaved();
            totalCo2 = lcaItemA.co2Saved() + lcaItemB.co2Saved();
            updateUserImpact(userIdFrom, totalWater / 2, totalCo2 / 2);
            updateUserImpact(userIdTo, totalWater / 2, totalCo2 / 2);
        } else {
            // Fallback for legacy data anomalies where reverse item is missing:
            // still provide impact based on the confirmed target item.
            LcaService.LcaResult lcaItemB = lcaService.calculateSavings(itemB.getCategory(), itemB.getClothingType());
            totalWater = lcaItemB.waterSaved();
            totalCo2 = lcaItemB.co2Saved();
            updateUserImpact(userIdFrom, totalWater / 2, totalCo2 / 2);
            updateUserImpact(userIdTo, totalWater / 2, totalCo2 / 2);
        }

        // 2. Confirm Swipes
        forwardSwipe.setConfirmed(true);
        reverseSwipe.setConfirmed(true);
        swipeRepo.save(forwardSwipe);
        swipeRepo.save(reverseSwipe);

        return buildConfirmResult(true, "Swap confirmed and impact recorded!", totalWater, totalCo2);
    }

    @Transactional
    public void rejectMatch(Long userIdFrom, Long itemIdTo) {
        swipeRepo.findByUserIdFromAndItemIdTo(userIdFrom, itemIdTo).ifPresent(swipe -> {
            swipe.setAction("REJECTED"); 
            swipe.setConfirmed(false);
            swipeRepo.save(swipe);
        });
    }

    private void updateUserImpact(Long userId, double water, double co2) {
        userRepo.findById(userId).ifPresent(user -> {
            user.setTotalWaterSaved(user.getTotalWaterSaved() + water);
            user.setTotalCo2Saved(user.getTotalCo2Saved() + co2);
            user.setTotalSwapsCompleted(user.getTotalSwapsCompleted() + 1);
            userRepo.save(user);
        });
    }

    public List<Map<String, Object>> getMatches(Long userId) {
        List<ClothingItem> userItems = itemRepo.findByUserId(userId).stream()
                .filter(ClothingItem::isActive)
                .collect(Collectors.toList());
        Set<Long> userItemIds = userItems.stream().map(ClothingItem::getId).collect(Collectors.toSet());
        Map<Long, ClothingItem> userItemsById = userItems.stream()
                .collect(Collectors.toMap(ClothingItem::getId, i -> i));

        List<SwipeLedger> userRightSwipes = swipeRepo.findByUserIdFromAndAction(userId, "RIGHT")
                .stream()
                .filter(s -> !s.isConfirmed())
                // Defensive dedupe in case historical ledger rows contain duplicates.
                .collect(Collectors.toMap(
                        SwipeLedger::getItemIdTo,
                        s -> s,
                        (a, b) -> a
                ))
                .values()
                .stream()
                .collect(Collectors.toList());

        List<Map<String, Object>> matches = new ArrayList<>();
        Set<String> emittedPairs = new HashSet<>();
        Set<String> emittedCardSignatures = new HashSet<>();
        Map<Long, List<SwipeLedger>> targetRightsByUser = new HashMap<>();

        for (SwipeLedger swipe : userRightSwipes) {
            Optional<ClothingItem> targetItemOpt = itemRepo.findById(swipe.getItemIdTo());
            
            // FIX: Ensure item is still active
            if (targetItemOpt.isEmpty() || !targetItemOpt.get().isActive()) continue;

            ClothingItem targetItem = targetItemOpt.get();
            Long targetUserId = targetItem.getUserId();
            if (Objects.equals(targetUserId, userId)) {
                continue;
            }

            List<SwipeLedger> targetRightSwipes = targetRightsByUser.computeIfAbsent(
                    targetUserId,
                    id -> swipeRepo.findByUserIdFromAndAction(id, "RIGHT")
                            .stream()
                            .filter(s -> !s.isConfirmed())
                            .collect(Collectors.toMap(
                                    SwipeLedger::getItemIdTo,
                                    s -> s,
                                    (a, b) -> a
                            ))
                            .values()
                            .stream()
                            .collect(Collectors.toList())
            );

            for (SwipeLedger reverse : targetRightSwipes) {
                if (!userItemIds.contains(reverse.getItemIdTo())) {
                    continue;
                }
                ClothingItem ownItem = userItemsById.get(reverse.getItemIdTo());
                if (ownItem == null || !ownItem.isActive()) {
                    continue;
                }

                String pairKey = ownItem.getId() + ":" + targetItem.getId();
                if (!emittedPairs.add(pairKey)) {
                    continue;
                }
                String cardSignature = buildCardSignature(targetUserId, ownItem, targetItem);
                if (!emittedCardSignatures.add(cardSignature)) {
                    continue;
                }

                Map<String, Object> match = new HashMap<>();
                match.put("id", pairKey);
                match.put("itemId", targetItem.getId());
                match.put("ownItemId", ownItem.getId());
                match.put("ownItem", ownItem);
                match.put("matchedItem", targetItem);
                match.put("matchedWithUserId", targetUserId);
                userRepo.findById(targetUserId).ifPresent(u -> {
                    match.put("matchedWithUsername", u.getUsername());
                    match.put("matchedWithEmail", u.getEmail());
                    match.put("matchedWithPhoneNumber", u.getPhoneNumber());
                    match.put("matchedWithContactUrl", u.getContactUrl());
                });

                matches.add(match);
            }
        }
        return matches;
    }

    private String buildCardSignature(Long targetUserId, ClothingItem ownItem, ClothingItem targetItem) {
        return String.join("|",
                String.valueOf(targetUserId),
                normalizeForMatchCard(ownItem.getTitle()),
                normalizeForMatchCard(ownItem.getSize()),
                normalizeForMatchCard(ownItem.getCondition()),
                normalizeForMatchCard(ownItem.getImageUrl()),
                normalizeForMatchCard(targetItem.getTitle()),
                normalizeForMatchCard(targetItem.getSize()),
                normalizeForMatchCard(targetItem.getCondition()),
                normalizeForMatchCard(targetItem.getImageUrl())
        );
    }

    private String normalizeForMatchCard(String value) {
        if (value == null) return "";
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
