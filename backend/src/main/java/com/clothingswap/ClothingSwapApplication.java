package com.clothingswap;

import com.clothingswap.service.DataSeederService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ClothingSwapApplication {
    public static void main(String[] args) {
        SpringApplication.run(ClothingSwapApplication.class, args);
    }

    @Bean
    CommandLineRunner seedData(DataSeederService seeder) {
        return args -> seeder.seed();
    }
}
