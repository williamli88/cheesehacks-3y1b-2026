package com.clothingswap.controller;

import com.clothingswap.model.ClothingItem;
import com.clothingswap.repository.ClothingItemRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/items")
public class ItemController {

    private final ClothingItemRepository itemRepo;

    public ItemController(ClothingItemRepository itemRepo) {
        this.itemRepo = itemRepo;
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
}
