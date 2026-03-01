package com.clothingswap.controller;

import com.clothingswap.model.ClothingItem;
import com.clothingswap.repository.ClothingItemRepository;
import com.clothingswap.repository.SwipeLedgerRepository;
import com.clothingswap.model.SwipeLedger;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/items")
public class ItemController {

    private final ClothingItemRepository itemRepo;
    private final SwipeLedgerRepository swipeRepo;

    public ItemController(ClothingItemRepository itemRepo, SwipeLedgerRepository swipeRepo) {
        this.itemRepo = itemRepo;
        this.swipeRepo = swipeRepo;
    }

    @PostMapping
    public ResponseEntity<?> createItem(@RequestBody ClothingItem item) {
        if (item.getUserId() == null) {
            return ResponseEntity.badRequest().body("userId is required");
        }
        ClothingItem saved = itemRepo.save(item);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> listUserItems(@PathVariable Long userId) {
        List<ClothingItem> items = itemRepo.findByUserId(userId);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/liked/{userId}")
    public ResponseEntity<?> listLikedItems(@PathVariable Long userId) {
        List<SwipeLedger> rights = swipeRepo.findByUserIdFromAndAction(userId, "RIGHT");
        List<Long> itemIds = rights.stream().map(SwipeLedger::getItemIdTo).toList();
        List<ClothingItem> items = itemRepo.findAllById(itemIds);
        return ResponseEntity.ok(items);
    }
}
