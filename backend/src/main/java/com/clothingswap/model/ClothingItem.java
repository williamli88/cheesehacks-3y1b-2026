package com.clothingswap.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "clothing_items")
@Data
@NoArgsConstructor
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
}
