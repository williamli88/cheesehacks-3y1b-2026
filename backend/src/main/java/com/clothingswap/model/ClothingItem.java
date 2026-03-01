package com.clothingswap.model;

import jakarta.persistence.*;

@Entity
@Table(name = "clothing_items")
public class ClothingItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String category;  
    private String gender; // MEN, WOMEN
    private String clothingType; // TOPS, BOTTOMS, OUTERWEAR, FOOTWEAR, ACCESSORIES
    private String size;      
    private String condition; 
    private String color; // primary color
    private String style; // ACTIVE, STREET, FORMAL, VINTAGE

    @Column(length = 500)
    private String colorTags; 

    @Column(length = 500)
    private String styleTags; 

    private String campus;
    @Column(columnDefinition = "TEXT")
    private String imageUrl;
    private String title;
    private String description;

    // NEW: Tracks if the item has been swapped
    @Column(columnDefinition = "boolean default true")
    private boolean active = true; 

    public ClothingItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getClothingType() { return clothingType; }
    public void setClothingType(String clothingType) { this.clothingType = clothingType; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getStyle() { return style; }
    public void setStyle(String style) { this.style = style; }

    public String getColorTags() { return colorTags; }
    public void setColorTags(String colorTags) { this.colorTags = colorTags; }

    public String getStyleTags() { return styleTags; }
    public void setStyleTags(String styleTags) { this.styleTags = styleTags; }

    public String getCampus() { return campus; }
    public void setCampus(String campus) { this.campus = campus; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    // NEW: Getters and Setters for active
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
