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
import java.util.stream.Collectors;

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
        private static final Set<String> DEMO_ITEM_KEYS = DEMO_ITEM_BANK.stream()
            .map(DataSeederService::templateKey)
            .collect(Collectors.toUnmodifiableSet());

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
        int deactivated = deactivateItemsOutsideDemoBank();
        if (deactivated > 0) {
            log.info("Deactivated {} item(s) outside the demo item bank.", deactivated);
        }

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

    public static boolean isDemoBankItem(ClothingItem item) {
        if (item == null) {
            return false;
        }
        return DEMO_ITEM_KEYS.contains(itemKey(item));
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

    private int deactivateItemsOutsideDemoBank() {
        int updated = 0;
        for (ClothingItem item : itemRepo.findAll()) {
            if (isDemoBankItem(item)) {
                continue;
            }
            if (!item.isActive()) {
                continue;
            }
            item.setActive(false);
            itemRepo.save(item);
            updated++;
        }
        return updated;
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

        addBankVariants(bank, "Carpenter Jeans", "Dickies carpenter denim",
            "Jeans", "MEN", "VINTAGE", "vintage,street", "navy", "navy, blue", "/P6%20(1).jpg");
        addBankVariants(bank, "Red Basketball Shorts", "red shorts with white stripes",
            "SHORTS", "MEN", "STREET", "street,active", "red", "red,white", "/P6%20(2).jpg");
        addBankVariants(bank, "Light wash jeans", "Vintage Levis straight fit",
            "JEANS", "MEN", "VINTAGE", "vintage,street", "blue", "white,blue", "/P6%20(3).jpg");
        addBankVariants(bank, "Black Sweatpants", "soft sweatpants for daily wear.",
            "PANTS", "WOMEN", "STREET", "street,active", "black", "black,black", "/P6%20(4).jpg");
        addBankVariants(bank, "Gold Necklace", "Gold pendant necklace.",
            "ACCESSORY", "WOMEN", "STREET", "street,formal", "gold", "gold,white", "/P6%20(5).jpg");
        addBankVariants(bank, "Relaxed Weekend Tee", "Lightweight tee cut for comfort.",
            "TSHIRT", "WOMEN", "ACTIVE", "active,street", "white", "grey,white", "/P6%20(6).jpg");

        addBankVariants(bank, "Blue button-up", "Classic button-up with slight fade.",
            "Shirts", "MEN", "STREET", "street,vintage", "indigo", "indigo,blue", "/P6%20(7).jpg");
        addBankVariants(bank, "Navy blue crewneck", "cozy sweater for everyday wear.",
            "SWEATER", "MEN", "STREET", "street,casual", "blue", "blue,navy", "/P6%20(8).jpg");
        addBankVariants(bank, "Ripped Denim Jeans", "Structured high-rise denim for clean silhouettes.",
            "JEANS", "MEN", "STREET", "vintage,street", "blue", "lightblue,white", "/P6%20(9).jpg");
        addBankVariants(bank, "Black windbreaker", "Lightweight jacket.",
            "JACKET", "MEN", "ACTIVE", "active,street", "black", "black,red", "/P6%20(10).jpg");
                
        addBankVariants(bank, "Military Pants", "Green vintage cargo pants",
            "Pants", "MEN", "VINTAGE", "vintage,street", "green", "green, brown", "/P6%20(11).jpg")   ;
        addBankVariants(bank, "ribbed tee", "ribbed cotton tee for everyday wear.",
            "TSHIRT", "WOMEN", "STREET", "street,active", "white", "cream,white", "/P6%20(12).jpg");
        addBankVariants(bank, "Long Sleeve Shirt", "Striped long sleeve shirt.",
            "SHIRT", "MEN", "VINTAGE", "vintage,street", "red", "white,red", "/P6%20(13).jpg");
        addBankVariants(bank, "Jean shorts", "Black jean shorts with frayed hem.",
            "SHORTS", "WOMEN", "STREET", "street,formal", "black", "black,brown", "/P6%20(14).jpg");
        addBankVariants(bank, "Nike tee", "Yellow just doit print tee.",
            "TSHIRT", "MEN", "STREET", "street,active", "Yellow", "Yellow,black", "/P6%20(15).jpg");
        addBankVariants(bank, "Iowa tee", "Iowa football graphic tee",
            "TSHIRT", "MEN", "ACTIVE", "active,street", "Black", "Black,yellow", "/P6%20(16).jpg");

        

        addBankVariants(bank, "Red zip-up", "faded hollister zip-up.",
            "SWEATSHIRT", "MEN", "STREET", "street,vintage", "red", "orange,red", "/P6%20(17).jpg");
        addBankVariants(bank, "hanes vintage tee", "navy blue oversized tee",
            "TSHIRT", "MEN", "VINTAGE", "vintage,street", "blue", "blue,navy", "/P6%20(18).jpg");
        addBankVariants(bank, "crop top", "Structured high-rise denim for clean silhouettes.",
            "TSHIRT", "WOMEN", "FORMAL", "formal,street", "brown", "brown,black", "/P6%20(19).jpg");
        addBankVariants(bank, "Dickies shirt", "Oversized pocket tee",
            "TSHIRT", "MEN", "VINTAGE", "vintage,street", "green", "green,black", "/P6%20(20).jpg");
        addBankVariants(bank, "Brown tee", "nice brown tee.",
            "TSHIRT", "MEN", "STREET", "street,vintage", "brown", "brown,chocolate", "/P6.jpg");
        addBankVariants(bank, "Dickies cargo pants", "Utility pants with tool pocket.",   
            "PANTS", "MEN", "VINTAGE", "vintage,street", "green", "green,black", "/P6%20(22).jpg");
        addBankVariants(bank, "High-Rise Denim Jeans", "Structured high-rise denim for clean silhouettes.",
            "JEANS", "WOMEN", "FORMAL", "formal,street", "darkblue", "darkblue,black", "/P6.jpg");

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
