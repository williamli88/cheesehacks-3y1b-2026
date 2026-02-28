package com.clothingswap.controller;

import com.clothingswap.model.User;
import com.clothingswap.repository.UserRepository;
import com.clothingswap.service.LcaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/impact")
public class ImpactController {

    private final UserRepository userRepo;
    private final LcaService lcaService;

    public ImpactController(UserRepository userRepo, LcaService lcaService) {
        this.userRepo = userRepo;
        this.lcaService = lcaService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getImpact(@PathVariable Long userId) {
        Optional<User> userOpt = userRepo.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        Map<String, Object> impact = lcaService.getTranslatedImpact(
            user.getTotalWaterSaved(),
            user.getTotalCo2Saved(),
            user.getTotalSwapsCompleted()
        );

        return ResponseEntity.ok(impact);
    }
}
