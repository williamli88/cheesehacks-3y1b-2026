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
}
