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
    public boolean confirmSwap(Long userIdFrom, Long itemIdTo) {
        Optional<ClothingItem> itemBOpt = itemRepo.findById(itemIdTo);
        if (itemBOpt.isEmpty() || !itemBOpt.get().isActive()) return false;
        ClothingItem itemB = itemBOpt.get();
        Long userIdTo = itemB.getUserId();

        Optional<SwipeLedger> forwardSwipeOpt = swipeRepo.findByUserIdFromAndItemIdTo(userIdFrom, itemIdTo);
        if (forwardSwipeOpt.isEmpty() || !"RIGHT".equals(forwardSwipeOpt.get().getAction())) return false;
        
        SwipeLedger forwardSwipe = forwardSwipeOpt.get();
        if (forwardSwipe.isConfirmed()) return false;

        List<ClothingItem> userAItems = itemRepo.findByUserId(userIdFrom);
        Set<Long> userAItemIds = userAItems.stream().map(ClothingItem::getId).collect(Collectors.toSet());
        
        Optional<SwipeLedger> reverseSwipeOpt = swipeRepo.findByUserIdFromAndAction(userIdTo, "RIGHT")
                .stream()
                .filter(s -> userAItemIds.contains(s.getItemIdTo()) && !s.isConfirmed())
                .findFirst();

        if (reverseSwipeOpt.isEmpty()) return false;
        SwipeLedger reverseSwipe = reverseSwipeOpt.get();

        // 1. Mark Items as Inactive (Removes from feed and matches)
        itemB.setActive(false);
        itemRepo.save(itemB);

        Optional<ClothingItem> itemAOpt = itemRepo.findById(reverseSwipe.getItemIdTo());
        if (itemAOpt.isPresent()) {
            ClothingItem itemA = itemAOpt.get();
            itemA.setActive(false);
            itemRepo.save(itemA);

            // Calculate Savings
            LcaService.LcaResult lcaItemB = lcaService.calculateSavings(itemB.getCategory());
            LcaService.LcaResult lcaItemA = lcaService.calculateSavings(itemA.getCategory());
            double totalWater = lcaItemA.waterSaved() + lcaItemB.waterSaved();
            double totalCo2 = lcaItemA.co2Saved() + lcaItemB.co2Saved();
            updateUserImpact(userIdFrom, totalWater / 2, totalCo2 / 2);
            updateUserImpact(userIdTo, totalWater / 2, totalCo2 / 2);
        }

        // 2. Confirm Swipes
        forwardSwipe.setConfirmed(true);
        reverseSwipe.setConfirmed(true);
        swipeRepo.save(forwardSwipe);
        swipeRepo.save(reverseSwipe);

        return true;
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
        List<ClothingItem> userItems = itemRepo.findByUserId(userId);
        Set<Long> userItemIds = userItems.stream().map(ClothingItem::getId).collect(Collectors.toSet());

        List<SwipeLedger> userRightSwipes = swipeRepo.findByUserIdFromAndAction(userId, "RIGHT")
                .stream()
                .filter(s -> !s.isConfirmed())
                .collect(Collectors.toList());

        List<Map<String, Object>> matches = new ArrayList<>();
        Set<Long> matchedUserIds = new HashSet<>();

        for (SwipeLedger swipe : userRightSwipes) {
            Optional<ClothingItem> targetItemOpt = itemRepo.findById(swipe.getItemIdTo());
            
            // FIX: Ensure item is still active
            if (targetItemOpt.isEmpty() || !targetItemOpt.get().isActive()) continue;

            ClothingItem targetItem = targetItemOpt.get();
            Long targetUserId = targetItem.getUserId();

            // Prevent multiple cards for the same matched user
            if (matchedUserIds.contains(targetUserId)) continue;

            List<SwipeLedger> targetRightSwipes = swipeRepo.findByUserIdFromAndAction(targetUserId, "RIGHT");
            boolean isMatch = targetRightSwipes.stream()
                    .anyMatch(s -> userItemIds.contains(s.getItemIdTo()) && !s.isConfirmed());

            if (isMatch) {
                Map<String, Object> match = new HashMap<>();
                match.put("itemId", targetItem.getId()); 
                match.put("matchedItem", targetItem);
                match.put("matchedWithUserId", targetUserId);
                userRepo.findById(targetUserId).ifPresent(u -> {
                    match.put("matchedWithUsername", u.getUsername());
                    match.put("matchedWithEmail", u.getEmail());
                    match.put("matchedWithContactUrl", u.getContactUrl());
                });
                
                matches.add(match);
                matchedUserIds.add(targetUserId);
            }
        }
        return matches;
    }
}