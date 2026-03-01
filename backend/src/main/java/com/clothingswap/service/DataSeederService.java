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
        if (userRepo.count() > 0) {
            backfillMissingPhoneNumbers();
            return;
        }

        Random rng = new Random(42);
        String[] domains = {"mit.edu", "harvard.edu", "stanford.edu"};
        String[] categories = {"TSHIRT", "JEANS", "JACKET", "DRESS", "SHOES", "SWEATER", "SKIRT", "SHORTS"};
        String[] genders = {"MEN", "WOMEN"};
        String[] sizes = {"XS", "S", "M", "L", "XL"};
        String[] conditions = {"NEW", "GOOD", "FAIR"};
        String[] colors = {"red", "blue", "green", "black", "white", "grey", "purple", "yellow", "pink", "brown"};
        String[] styles = {"ACTIVE", "STREET", "FORMAL", "VINTAGE"};
        String[] firstNames = {"Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Parker",
                               "Quinn", "Sage", "Blake", "Drew", "Hayden", "Jamie", "Kendall",
                               "Lesley", "Mika", "Nico", "Peyton", "Robin"};

        List<User> users = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            User user = new User();
            user.setUsername(firstNames[i].toLowerCase() + (1000 + rng.nextInt(9000)));
            
            // Assign a valid domain
            String domain = domains[rng.nextInt(domains.length)];
            user.setEmail(user.getUsername() + "@" + domain);
            user.setPhoneNumber(generateFakePhone(rng));
            
            user.setContactUrl("mailto:" + user.getEmail());
            user.setPassword(passwordEncoder.encode("password123"));
            
            // Let the User model calculate the campus from the email
            user.setCampusFromEmail(user.getEmail()); 
            
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
            item.setGender(genders[rng.nextInt(genders.length)]);
            item.setClothingType(mapCategoryToType(category));
            item.setSize(sizes[rng.nextInt(sizes.length)]);
            item.setCondition(conditions[rng.nextInt(conditions.length)]);

            String color1 = colors[rng.nextInt(colors.length)];
            String color2 = colors[rng.nextInt(colors.length)];
            item.setColor(color1);
            item.setColorTags(color1 + "," + color2);

            String style1 = styles[rng.nextInt(styles.length)];
            String style2 = styles[rng.nextInt(styles.length)];
            item.setStyle(style1);
            item.setStyleTags(style1.toLowerCase() + "," + style2.toLowerCase());

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

    private String mapCategoryToType(String category) {
        return switch (category) {
            case "TSHIRT", "DRESS", "SWEATER" -> "TOPS";
            case "JEANS", "SKIRT", "SHORTS" -> "BOTTOMS";
            case "JACKET" -> "OUTERWEAR";
            case "SHOES" -> "FOOTWEAR";
            default -> "ACCESSORIES";
        };
    }

    private void backfillMissingPhoneNumbers() {
        Random rng = new Random(4242);
        List<User> users = userRepo.findAll();
        for (User user : users) {
            if (user.getPhoneNumber() == null || user.getPhoneNumber().isBlank()) {
                user.setPhoneNumber(generateFakePhone(rng));
                userRepo.save(user);
            }
        }
    }

    private String generateFakePhone(Random rng) {
        // E.164-style fake US number for demo accounts.
        int area = 200 + rng.nextInt(800);
        int mid = 200 + rng.nextInt(800);
        int last = 1000 + rng.nextInt(9000);
        return String.format("+1%03d%03d%04d", area, mid, last);
    }
}
