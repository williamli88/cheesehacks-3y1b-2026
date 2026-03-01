package com.clothingswap.controller;

import com.clothingswap.service.SwipeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/matches")
public class MatchController {

    private final SwipeService swipeService;

    public MatchController(SwipeService swipeService) {
        this.swipeService = swipeService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getMatches(@PathVariable Long userId) {
        List<Map<String, Object>> matches = swipeService.getMatches(userId);
        return ResponseEntity.ok(matches);
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmSwap(@RequestBody Map<String, Long> request) {
        Long userId = request.get("userId");
        Long itemId = request.get("itemId");
        Long ownItemId = request.get("ownItemId");

        if (userId == null || itemId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId and itemId are required"));
        }

        Map<String, Object> result = swipeService.confirmSwap(userId, itemId, ownItemId);
        boolean recorded = Boolean.TRUE.equals(result.get("recorded"));
        if (!recorded) {
            return ResponseEntity.status(409).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reject")
    public ResponseEntity<?> rejectSwap(@RequestBody Map<String, Long> request) {
        Long userId = request.get("userId");
        Long itemId = request.get("itemId");

        if (userId == null || itemId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId and itemId are required"));
        }

        swipeService.rejectMatch(userId, itemId);
        return ResponseEntity.ok(Map.of("recorded", true));
    }
}
