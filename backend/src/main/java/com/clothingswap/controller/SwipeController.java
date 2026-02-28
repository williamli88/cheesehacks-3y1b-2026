package com.clothingswap.controller;

import com.clothingswap.service.SwipeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/swipe")
public class SwipeController {

    private final SwipeService swipeService;

    public SwipeController(SwipeService swipeService) {
        this.swipeService = swipeService;
    }

    @PostMapping
    public ResponseEntity<?> recordSwipe(@RequestBody Map<String, Object> request) {
        Object userIdFromRaw = request.get("userIdFrom");
        Object itemIdToRaw = request.get("itemIdTo");
        Object actionRaw = request.get("action");

        if (userIdFromRaw == null || itemIdToRaw == null || actionRaw == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userIdFrom, itemIdTo, and action are required"));
        }

        Long userIdFrom = Long.valueOf(userIdFromRaw.toString());
        Long itemIdTo = Long.valueOf(itemIdToRaw.toString());
        String action = actionRaw.toString();

        if (!action.equals("RIGHT") && !action.equals("LEFT")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Action must be RIGHT or LEFT"));
        }

        Map<String, Object> result = swipeService.recordSwipe(userIdFrom, itemIdTo, action);
        return ResponseEntity.ok(result);
    }
}
