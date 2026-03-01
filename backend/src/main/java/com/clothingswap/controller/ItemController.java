package com.clothingswap.controller;

import com.clothingswap.model.ClothingItem;
import com.clothingswap.repository.ClothingItemRepository;
import com.clothingswap.repository.SwipeLedgerRepository;
import com.clothingswap.model.SwipeLedger;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

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

    @PutMapping("/{itemId}")
    public ResponseEntity<?> updateItem(@PathVariable Long itemId, @RequestBody ClothingItem request) {
        Optional<ClothingItem> existingOpt = itemRepo.findById(itemId);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Item not found");
        }

        ClothingItem item = existingOpt.get();
        if (request.getTitle() != null) item.setTitle(request.getTitle());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getCategory() != null) item.setCategory(request.getCategory());
        if (request.getGender() != null) item.setGender(request.getGender());
        if (request.getClothingType() != null) item.setClothingType(request.getClothingType());
        if (request.getSize() != null) item.setSize(request.getSize());
        if (request.getCondition() != null) item.setCondition(request.getCondition());
        if (request.getColor() != null) item.setColor(request.getColor());
        if (request.getStyle() != null) item.setStyle(request.getStyle());
        if (request.getColorTags() != null) item.setColorTags(request.getColorTags());
        if (request.getStyleTags() != null) item.setStyleTags(request.getStyleTags());
        if (request.getCampus() != null) item.setCampus(request.getCampus());
        if (request.getImageUrl() != null) item.setImageUrl(request.getImageUrl());

        ClothingItem saved = itemRepo.save(item);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<?> deleteItem(@PathVariable Long itemId) {
        Optional<ClothingItem> existingOpt = itemRepo.findById(itemId);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Item not found");
        }

        swipeRepo.deleteByItemIdTo(itemId);
        itemRepo.deleteById(itemId);
        return ResponseEntity.ok("Item deleted");
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
