package com.clothingswap.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;
    private String password;
    private String campus;

    // optional contact link (mailto: or social URL)
    private String contactUrl;

    private double totalWaterSaved = 0.0;
    private double totalCo2Saved = 0.0;
    private int totalSwapsCompleted = 0;

    public User() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getCampus() { return campus; }
    public void setCampus(String campus) { this.campus = campus; }

    public String getContactUrl() { return contactUrl; }
    public void setContactUrl(String contactUrl) { this.contactUrl = contactUrl; }

    public double getTotalWaterSaved() { return totalWaterSaved; }
    public void setTotalWaterSaved(double totalWaterSaved) { this.totalWaterSaved = totalWaterSaved; }

    public double getTotalCo2Saved() { return totalCo2Saved; }
    public void setTotalCo2Saved(double totalCo2Saved) { this.totalCo2Saved = totalCo2Saved; }

    public int getTotalSwapsCompleted() { return totalSwapsCompleted; }
    public void setTotalSwapsCompleted(int totalSwapsCompleted) { this.totalSwapsCompleted = totalSwapsCompleted; }
}
