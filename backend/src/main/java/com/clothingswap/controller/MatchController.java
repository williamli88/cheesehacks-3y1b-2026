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

        if (userId == null || itemId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId and itemId are required"));
        }

        boolean recorded = swipeService.confirmSwap(userId, itemId);
        if (!recorded) {
            return ResponseEntity.status(409).body(Map.of(
                    "message", "Swap confirmation did not change impact (already confirmed or no valid pair)"
            ));
        }
        return ResponseEntity.ok(Map.of("message", "Swap confirmed and impact recorded!"));
    }
}
