package com.clothingswap.service;

import com.clothingswap.model.ClothingItem;
import com.clothingswap.model.SwipeLedger;
import com.clothingswap.model.User;
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
        if (targetItem.isEmpty()) return false;

        Long targetUserId = targetItem.get().getUserId();

        List<ClothingItem> userAItems = itemRepo.findByUserId(userIdFrom);
        if (userAItems.isEmpty()) return false;

        List<SwipeLedger> targetUserRightSwipes = swipeRepo.findByUserIdFromAndAction(targetUserId, "RIGHT");

        Set<Long> userAItemIds = userAItems.stream().map(ClothingItem::getId).collect(Collectors.toSet());

        return targetUserRightSwipes.stream()
            .anyMatch(s -> userAItemIds.contains(s.getItemIdTo()));
    }

    @Transactional
    public void confirmSwap(Long userIdFrom, Long itemIdTo) {
        // 1. Get the item User A matched with (Item B)
        Optional<ClothingItem> itemBOpt = itemRepo.findById(itemIdTo);
        if (itemBOpt.isEmpty()) return;
        ClothingItem itemB = itemBOpt.get();
        Long userIdTo = itemB.getUserId();

        // 2. Find the reverse swipe to get Item A
        List<ClothingItem> userAItems = itemRepo.findByUserId(userIdFrom);
        Set<Long> userAItemIds = userAItems.stream().map(ClothingItem::getId).collect(Collectors.toSet());
        
        Optional<SwipeLedger> reverseSwipe = swipeRepo.findByUserIdFromAndAction(userIdTo, "RIGHT")
                .stream()
                .filter(s -> userAItemIds.contains(s.getItemIdTo()))
                .findFirst();

        if (reverseSwipe.isEmpty()) return; 

        // 3. Calculate combined savings for BOTH items
        LcaService.LcaResult lcaItemB = lcaService.calculateSavings(itemB.getCategory());
        ClothingItem itemA = itemRepo.findById(reverseSwipe.get().getItemIdTo()).get();
        LcaService.LcaResult lcaItemA = lcaService.calculateSavings(itemA.getCategory());

        double totalWater = lcaItemA.waterSaved() + lcaItemB.waterSaved();
        double totalCo2 = lcaItemA.co2Saved() + lcaItemB.co2Saved();

        // 4. Update both users
        updateUserImpact(userIdFrom, totalWater/2, totalCo2/2);
        updateUserImpact(userIdTo, totalWater/2, totalCo2/2);
    }

    // Helper method to keep code clean
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

        List<SwipeLedger> userRightSwipes = swipeRepo.findByUserIdFromAndAction(userId, "RIGHT");

        List<Map<String, Object>> matches = new ArrayList<>();

        for (SwipeLedger swipe : userRightSwipes) {
            Optional<ClothingItem> targetItemOpt = itemRepo.findById(swipe.getItemIdTo());
            if (targetItemOpt.isEmpty()) continue;

            ClothingItem targetItem = targetItemOpt.get();
            Long targetUserId = targetItem.getUserId();

            List<SwipeLedger> targetRightSwipes = swipeRepo.findByUserIdFromAndAction(targetUserId, "RIGHT");
            boolean isMatch = targetRightSwipes.stream().anyMatch(s -> userItemIds.contains(s.getItemIdTo()));

            if (isMatch) {
                Map<String, Object> match = new HashMap<>();
                match.put("matchedItem", targetItem);
                match.put("matchedWithUserId", targetUserId);
                userRepo.findById(targetUserId).ifPresent(u -> match.put("matchedWithUsername", u.getUsername()));
                matches.add(match);
            }
        }

        return matches;
    }
}
