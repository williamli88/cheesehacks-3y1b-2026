package com.clothingswap.service;

import com.clothingswap.model.ClothingItem;
import com.clothingswap.model.User;
import com.clothingswap.repository.ClothingItemRepository;
import com.clothingswap.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class DataSeederService {

    private final UserRepository userRepo;
    private final ClothingItemRepository itemRepo;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataSeederService(UserRepository userRepo, ClothingItemRepository itemRepo) {
        this.userRepo = userRepo;
        this.itemRepo = itemRepo;
    }

    public void seed() {
        if (userRepo.count() > 0) return;

        Random rng = new Random(42);
        String[] campuses = {"MIT", "Harvard", "Stanford"};
        String[] categories = {"TSHIRT", "JEANS", "JACKET", "DRESS", "SHOES", "SWEATER", "SKIRT", "SHORTS"};
        String[] sizes = {"XS", "S", "M", "L", "XL"};
        String[] conditions = {"NEW", "GOOD", "FAIR"};
        String[] colors = {"red", "blue", "green", "black", "white", "grey", "purple", "yellow", "pink", "brown"};
        String[] styles = {"casual", "formal", "sporty", "vintage", "streetwear", "minimalist", "bohemian", "preppy"};
        String[] firstNames = {"Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Parker",
                               "Quinn", "Sage", "Blake", "Drew", "Hayden", "Jamie", "Kendall",
                               "Lesley", "Mika", "Nico", "Peyton", "Robin"};

        List<User> users = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            User user = new User();
            user.setUsername(firstNames[i].toLowerCase() + (1000 + rng.nextInt(9000)));
            user.setEmail(user.getUsername() + "@campus.edu");
            user.setContactUrl("mailto:" + user.getEmail());
            user.setPassword(passwordEncoder.encode("password123"));
            user.setCampus(campuses[rng.nextInt(campuses.length)]);
            users.add(userRepo.save(user));
        }

        String[] imageUrls = {
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
            "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
            "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400",
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400",
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
            "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400",
            "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400",
            "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400"
        };

        for (int i = 0; i < 100; i++) {
            User owner = users.get(rng.nextInt(users.size()));
            ClothingItem item = new ClothingItem();
            item.setUserId(owner.getId());
            item.setCampus(owner.getCampus());

            String category = categories[rng.nextInt(categories.length)];
            item.setCategory(category);
            item.setSize(sizes[rng.nextInt(sizes.length)]);
            item.setCondition(conditions[rng.nextInt(conditions.length)]);

            String color1 = colors[rng.nextInt(colors.length)];
            String color2 = colors[rng.nextInt(colors.length)];
            item.setColorTags(color1 + "," + color2);

            String style1 = styles[rng.nextInt(styles.length)];
            String style2 = styles[rng.nextInt(styles.length)];
            item.setStyleTags(style1 + "," + style2);

            item.setTitle(capitalize(style1) + " " + capitalize(category.toLowerCase()));
            item.setDescription("A " + item.getCondition().toLowerCase() + " condition " +
                               item.getCategory().toLowerCase() + " in " + color1 + " color.");
            item.setImageUrl(imageUrls[i % imageUrls.length]);

            itemRepo.save(item);
        }
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
