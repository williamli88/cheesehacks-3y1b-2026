package com.clothingswap.controller;

import com.clothingswap.model.ClothingItem;
import com.clothingswap.model.User;
import com.clothingswap.repository.UserRepository;
import com.clothingswap.service.RecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/feed")
public class FeedController {

    private final RecommendationService recService;
    private final UserRepository userRepo;

    public FeedController(RecommendationService recService, UserRepository userRepo) {
        this.recService = recService;
        this.userRepo = userRepo;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getFeed(@PathVariable Long userId) {
        Optional<User> userOpt = userRepo.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User user = userOpt.get();
        List<ClothingItem> feed = recService.getRankedFeed(userId, user.getCampus(), null);

        return ResponseEntity.ok(feed);
    }
}
