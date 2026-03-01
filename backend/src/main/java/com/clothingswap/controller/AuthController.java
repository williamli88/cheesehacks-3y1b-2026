package com.clothingswap.controller;

import com.clothingswap.model.User;
import com.clothingswap.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        Optional<User> userOpt = userRepo.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("userId", user.getId());
        response.put("username", user.getUsername());
+        response.put("email", user.getEmail());
+        response.put("contactUrl", user.getContactUrl());
        response.put("campus", user.getCampus());
        response.put("token", "bearer-" + user.getId() + "-" + System.currentTimeMillis());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        if (userRepo.findByUsername(username).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("error", "Username already exists"));
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(request.get("email"));
        user.setContactUrl(request.getOrDefault("contactUrl", "mailto:" + request.get("email")));
        user.setPassword(passwordEncoder.encode(request.get("password")));
        user.setCampus(request.getOrDefault("campus", "MIT"));

        User saved = userRepo.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("userId", saved.getId());
        response.put("username", saved.getUsername());
        response.put("campus", saved.getCampus());
        response.put("token", "bearer-" + saved.getId() + "-" + System.currentTimeMillis());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<?> listUsers() {
        return ResponseEntity.ok(userRepo.findAll().stream()
            .map(u -> Map.of(
                "id", u.getId(),
                "username", u.getUsername(),
                "campus", u.getCampus(),
                "email", u.getEmail(),
                "contactUrl", u.getContactUrl()
            ))
            .toList());
    }
}

