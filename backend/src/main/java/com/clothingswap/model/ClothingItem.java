package com.clothingswap.model;

import jakarta.persistence.*;

@Entity
@Table(name = "clothing_items")
public class ClothingItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String category;  // TSHIRT, JEANS, JACKET, DRESS, SHOES
    private String size;      // XS, S, M, L, XL
    private String condition; // NEW, GOOD, FAIR

    @Column(length = 500)
    private String colorTags; // comma-separated

    @Column(length = 500)
    private String styleTags; // comma-separated

    private String campus;
    private String imageUrl;
    private String title;
    private String description;

    public ClothingItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

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
}
