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
            if (matched) {
                processMatch(userIdFrom, itemIdTo);
            }
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
    private void processMatch(Long userIdFrom, Long itemIdTo) {
        Optional<ClothingItem> itemOpt = itemRepo.findById(itemIdTo);
        if (itemOpt.isEmpty()) return;

        ClothingItem item = itemOpt.get();
        Long userIdTo = item.getUserId();

        LcaService.LcaResult lca = lcaService.calculateSavings(item.getCategory());

        userRepo.findById(userIdFrom).ifPresent(user -> {
            user.setTotalWaterSaved(user.getTotalWaterSaved() + lca.waterSaved());
            user.setTotalCo2Saved(user.getTotalCo2Saved() + lca.co2Saved());
            user.setTotalSwapsCompleted(user.getTotalSwapsCompleted() + 1);
            userRepo.save(user);
        });

        userRepo.findById(userIdTo).ifPresent(user -> {
            user.setTotalWaterSaved(user.getTotalWaterSaved() + lca.waterSaved());
            user.setTotalCo2Saved(user.getTotalCo2Saved() + lca.co2Saved());
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
