package com.clothingswap.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;
    private String password;
    private String campus;

    private double totalWaterSaved = 0.0;
    private double totalCo2Saved = 0.0;
    private int totalSwapsCompleted = 0;
}
