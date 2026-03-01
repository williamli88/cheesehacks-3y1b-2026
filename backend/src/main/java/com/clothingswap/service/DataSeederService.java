package com.clothingswap.service;

import com.clothingswap.model.ClothingItem;
import com.clothingswap.model.User;
import com.clothingswap.repository.ClothingItemRepository;
import com.clothingswap.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.Set;

@Service
public class DataSeederService {
    private static final Logger log = LoggerFactory.getLogger(DataSeederService.class);

    private static final String DEMO_PASSWORD = "password123";
    private static final int MIN_DEMO_ACTIVE_ITEMS = 6;
    private static final int TARGET_SEED_ITEM_COUNT = 100;

    private static final String[][] DEMO_USERS = {
            {"demo_mit", "mit.edu", "+16175550101"},
            {"demo_mit_2", "mit.edu", "+16175550111"},
            {"demo_harvard", "harvard.edu", "+16175550102"},
            {"demo_harvard_2", "harvard.edu", "+16175550112"},
            {"demo_stanford", "stanford.edu", "+16505550103"},
            {"demo_stanford_2", "stanford.edu", "+16505550113"},
            {"demo_wisc", "wisc.edu", "+16085550104"},
            {"demo_wisc_2", "wisc.edu", "+16085550114"},
            {"demo_berkeley", "berkeley.edu", "+15105550105"},
            {"demo_berkeley_2", "berkeley.edu", "+15105550115"},
            {"demo_ucla", "ucla.edu", "+13105550106"},
            {"demo_ucla_2", "ucla.edu", "+13105550116"}
    };

    private static final String[] DEMO_IMAGE_URLS = {
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
            "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
            "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400",
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400",
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
            "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400",
            "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400",
            "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400"
    };

    private static final String[] BANK_SIZES = {"S", "M", "L"};
    private static final String[] BANK_CONDITIONS = {"GOOD", "NEW"};

    // Curated demo bank. Edit these entries to define your own default demo inventory.
    private static final List<DemoItemTemplate> DEMO_ITEM_BANK = buildDemoItemBank();

    private final UserRepository userRepo;
    private final ClothingItemRepository itemRepo;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataSeederService(UserRepository userRepo, ClothingItemRepository itemRepo) {
        this.userRepo = userRepo;
        this.itemRepo = itemRepo;
    }

    public void seed() {
        boolean hasExistingUsers = userRepo.count() > 0;
        Random userRng = new Random(42);
        Random itemRng = new Random(2026);

        if (hasExistingUsers) {
            List<User> demos = ensureDemoUsers();
            backfillMissingPhoneNumbers();
            DemoItemPool demoItemPool = createDemoItemPool(itemRng);
            ensureDemoInventory(demos, demoItemPool);
            return;
        }

        List<User> demos = ensureDemoUsers();
        List<User> users = new ArrayList<>(demos);

        String[] domains = {"mit.edu", "harvard.edu", "stanford.edu"};
        String[] firstNames = {"Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Parker",
                               "Quinn", "Sage", "Blake", "Drew", "Hayden", "Jamie", "Kendall",
                               "Lesley", "Mika", "Nico", "Peyton", "Robin"};

        for (int i = users.size(); i < 20; i++) {
            User user = new User();
            user.setUsername(firstNames[i].toLowerCase(Locale.ROOT) + (1000 + userRng.nextInt(9000)));

            String domain = domains[userRng.nextInt(domains.length)];
            user.setEmail(user.getUsername() + "@" + domain);
            user.setPhoneNumber(generateFakePhone(userRng));
            user.setContactUrl("mailto:" + user.getEmail());
            user.setPassword(passwordEncoder.encode(DEMO_PASSWORD));
            user.setCampusFromEmail(user.getEmail());

            users.add(userRepo.save(user));
        }

        DemoItemPool demoItemPool = createDemoItemPool(itemRng);
        int demoItemsCreated = ensureDemoInventory(demos, demoItemPool);
        int remainingTarget = Math.max(0, TARGET_SEED_ITEM_COUNT - demoItemsCreated);
        seedRemainingItems(users, demoItemPool, remainingTarget, userRng);
    }

    private List<User> ensureDemoUsers() {
        List<User> demos = new ArrayList<>();

        for (String[] def : DEMO_USERS) {
            String username = def[0];
            String domain = def[1];
            String phone = def[2];
            String email = username + "@" + domain;

            User user = userRepo.findByUsername(username).orElseGet(User::new);
            user.setUsername(username);
            user.setEmail(email);
            user.setPhoneNumber(phone);
            user.setContactUrl("mailto:" + email);
            user.setPassword(passwordEncoder.encode(DEMO_PASSWORD));
            user.setCampusFromEmail(email);

            demos.add(userRepo.save(user));
        }

        return demos;
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

    private int ensureDemoInventory(List<User> demos, DemoItemPool pool) {
        int created = 0;

        for (User demo : demos) {
            long activeCount = itemRepo.findByUserId(demo.getId()).stream()
                    .filter(ClothingItem::isActive)
                    .count();
            int toCreate = (int) Math.max(0, MIN_DEMO_ACTIVE_ITEMS - activeCount);

            for (int i = 0; i < toCreate; i++) {
                if (!pool.hasNext()) {
                    log.warn("Demo item bank exhausted while ensuring demo inventory. {} items still needed.", toCreate - i);
                    return created;
                }

                itemRepo.save(buildItemFromTemplate(demo, pool.next()));
                created++;
            }
        }

        return created;
    }

    private int seedRemainingItems(List<User> users, DemoItemPool pool, int targetCount, Random rng) {
        int created = 0;

        for (int i = 0; i < targetCount; i++) {
            if (!pool.hasNext()) {
                log.warn("Demo item bank exhausted after creating {} of {} requested seed items.", created, targetCount);
                break;
            }

            User owner = users.get(rng.nextInt(users.size()));
            itemRepo.save(buildItemFromTemplate(owner, pool.next()));
            created++;
        }

        return created;
    }

    private DemoItemPool createDemoItemPool(Random rng) {
        Set<String> usedKeys = new HashSet<>();
        for (ClothingItem existing : itemRepo.findAll()) {
            usedKeys.add(itemKey(existing));
        }

        List<DemoItemTemplate> availableTemplates = new ArrayList<>();
        for (DemoItemTemplate template : DEMO_ITEM_BANK) {
            if (!usedKeys.contains(templateKey(template))) {
                availableTemplates.add(template);
            }
        }

        Collections.shuffle(availableTemplates, rng);
        return new DemoItemPool(availableTemplates);
    }

    private ClothingItem buildItemFromTemplate(User owner, DemoItemTemplate template) {
        ClothingItem item = new ClothingItem();
        item.setUserId(owner.getId());
        item.setCampus(owner.getCampus());

        item.setCategory(template.category());
        item.setGender(template.gender());
        item.setClothingType(mapCategoryToType(template.category()));
        item.setSize(template.size());
        item.setCondition(template.condition());

        item.setColor(template.color());
        item.setColorTags(template.colorTags());
        item.setStyle(template.style());
        item.setStyleTags(template.styleTags());

        item.setTitle(template.title());
        item.setDescription(template.description());
        item.setImageUrl(template.imageUrl());
        item.setActive(true);

        return item;
    }

    private static String templateKey(DemoItemTemplate template) {
        return String.join("|",
                normalize(template.title()),
                normalize(template.category()),
                normalize(template.gender()),
                normalize(template.size()),
                normalize(template.condition()),
                normalize(template.imageUrl()));
    }

    private static String itemKey(ClothingItem item) {
        return String.join("|",
                normalize(item.getTitle()),
                normalize(item.getCategory()),
                normalize(item.getGender()),
                normalize(item.getSize()),
                normalize(item.getCondition()),
                normalize(item.getImageUrl()));
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private static List<DemoItemTemplate> buildDemoItemBank() {
        List<DemoItemTemplate> bank = new ArrayList<>();

        addBankVariants(bank, "Campus Vintage Tee", "Soft cotton tee with a faded campus crest.",
                "TSHIRT", "MEN", "VINTAGE", "vintage,street", "navy", "navy,white", DEMO_IMAGE_URLS[0]);
        addBankVariants(bank, "Graphic Street Tee", "Boxy street tee with bold front art.",
                "TSHIRT", "MEN", "STREET", "street,active", "black", "black,red", DEMO_IMAGE_URLS[0]);
        addBankVariants(bank, "Varsity Stripe Tee", "Breathable tee with athletic shoulder stripes.",
                "TSHIRT", "MEN", "ACTIVE", "active,street", "white", "white,blue", DEMO_IMAGE_URLS[0]);
        addBankVariants(bank, "Ribbed Everyday Tee", "Soft rib-knit tee for daily wear.",
                "TSHIRT", "WOMEN", "STREET", "street,formal", "cream", "cream,brown", DEMO_IMAGE_URLS[0]);
        addBankVariants(bank, "Cropped Box Tee", "Relaxed cropped tee with clean hem.",
                "TSHIRT", "WOMEN", "STREET", "street,active", "pink", "pink,white", DEMO_IMAGE_URLS[0]);
        addBankVariants(bank, "Relaxed Weekend Tee", "Lightweight tee cut for comfort.",
                "TSHIRT", "WOMEN", "ACTIVE", "active,street", "grey", "grey,white", DEMO_IMAGE_URLS[0]);

        addBankVariants(bank, "Mid-Rise Straight Jeans", "Classic straight-leg denim with slight fade.",
                "JEANS", "MEN", "STREET", "street,vintage", "indigo", "indigo,blue", DEMO_IMAGE_URLS[1]);
        addBankVariants(bank, "Loose Carpenter Jeans", "Utility denim with relaxed fit and tool pocket.",
                "JEANS", "MEN", "VINTAGE", "vintage,street", "blue", "blue,brown", DEMO_IMAGE_URLS[1]);
        addBankVariants(bank, "High-Rise Denim Jeans", "Structured high-rise denim for clean silhouettes.",
                "JEANS", "WOMEN", "FORMAL", "formal,street", "darkblue", "darkblue,black", DEMO_IMAGE_URLS[1]);
        addBankVariants(bank, "Wide-Leg Blue Jeans", "Wide-leg denim with soft drape.",
                "JEANS", "WOMEN", "VINTAGE", "vintage,street", "lightblue", "lightblue,white", DEMO_IMAGE_URLS[1]);

        addBankVariants(bank, "Utility Bomber Jacket", "Light bomber with zip pockets and rib cuffs.",
                "JACKET", "MEN", "STREET", "street,active", "olive", "olive,black", DEMO_IMAGE_URLS[2]);
        addBankVariants(bank, "Lightweight Wind Jacket", "Packable shell built for windy days.",
                "JACKET", "MEN", "ACTIVE", "active,street", "teal", "teal,grey", DEMO_IMAGE_URLS[2]);
        addBankVariants(bank, "Cropped Moto Jacket", "Faux-leather moto with asymmetrical zip.",
                "JACKET", "WOMEN", "STREET", "street,formal", "black", "black,silver", DEMO_IMAGE_URLS[2]);
        addBankVariants(bank, "Quilted Puffer Jacket", "Warm quilted puffer for colder weather.",
                "JACKET", "WOMEN", "ACTIVE", "active,street", "tan", "tan,cream", DEMO_IMAGE_URLS[2]);

        addBankVariants(bank, "A-Line Midi Dress", "Flowing midi dress with a simple waist seam.",
                "DRESS", "WOMEN", "FORMAL", "formal,vintage", "emerald", "emerald,black", DEMO_IMAGE_URLS[3]);
        addBankVariants(bank, "Wrap Floral Dress", "Wrap-fit floral dress with soft movement.",
                "DRESS", "WOMEN", "VINTAGE", "vintage,formal", "rose", "rose,cream", DEMO_IMAGE_URLS[3]);

        addBankVariants(bank, "Classic Canvas Sneakers", "Low-top canvas sneakers with cushioned sole.",
                "SHOES", "MEN", "ACTIVE", "active,street", "white", "white,grey", DEMO_IMAGE_URLS[4]);
        addBankVariants(bank, "Retro Court Sneakers", "Retro-inspired court sneakers.",
                "SHOES", "WOMEN", "STREET", "street,active", "offwhite", "offwhite,green", DEMO_IMAGE_URLS[4]);

        addBankVariants(bank, "Knit Sweater Crew", "Soft crewneck sweater with textured knit.",
                "SWEATER", "MEN", "FORMAL", "formal,vintage", "charcoal", "charcoal,grey", DEMO_IMAGE_URLS[5]);
        addBankVariants(bank, "Soft Cable Sweater", "Cable-knit sweater with relaxed shoulder.",
                "SWEATER", "WOMEN", "FORMAL", "formal,vintage", "ivory", "ivory,beige", DEMO_IMAGE_URLS[5]);

        addBankVariants(bank, "Tennis Pleated Skirt", "Pleated skirt with crisp sporty lines.",
                "SKIRT", "WOMEN", "FORMAL", "formal,active", "white", "white,navy", DEMO_IMAGE_URLS[6]);
        addBankVariants(bank, "Denim Mini Skirt", "Structured mini skirt in washed denim.",
                "SKIRT", "WOMEN", "STREET", "street,vintage", "indigo", "indigo,black", DEMO_IMAGE_URLS[6]);

        addBankVariants(bank, "Athletic Mesh Shorts", "Breathable mesh shorts with drawstring waist.",
                "SHORTS", "MEN", "ACTIVE", "active,street", "black", "black,white", DEMO_IMAGE_URLS[7]);
        addBankVariants(bank, "Tailored Linen Shorts", "Tailored linen-blend shorts for warm days.",
                "SHORTS", "WOMEN", "FORMAL", "formal,street", "sand", "sand,white", DEMO_IMAGE_URLS[7]);

        return List.copyOf(bank);
    }

    private static void addBankVariants(
            List<DemoItemTemplate> bank,
            String title,
            String baseDescription,
            String category,
            String gender,
            String style,
            String styleTags,
            String color,
            String colorTags,
            String imageUrl
    ) {
        for (String size : BANK_SIZES) {
            for (String condition : BANK_CONDITIONS) {
                String variantTitle = title + " - " + size + " " + condition;
                String variantDescription = baseDescription + " Size " + size + ", " + condition.toLowerCase(Locale.ROOT) + " condition.";

                bank.add(new DemoItemTemplate(
                        variantTitle,
                        variantDescription,
                        category,
                        gender,
                        size,
                        condition,
                        color,
                        colorTags,
                        style,
                        styleTags,
                        imageUrl
                ));
            }
        }
    }

    private record DemoItemTemplate(
            String title,
            String description,
            String category,
            String gender,
            String size,
            String condition,
            String color,
            String colorTags,
            String style,
            String styleTags,
            String imageUrl
    ) {
    }

    private static final class DemoItemPool {
        private final List<DemoItemTemplate> templates;
        private int cursor = 0;

        private DemoItemPool(List<DemoItemTemplate> templates) {
            this.templates = templates;
        }

        private boolean hasNext() {
            return cursor < templates.size();
        }

        private DemoItemTemplate next() {
            DemoItemTemplate template = templates.get(cursor);
            cursor++;
            return template;
        }
    }
}
