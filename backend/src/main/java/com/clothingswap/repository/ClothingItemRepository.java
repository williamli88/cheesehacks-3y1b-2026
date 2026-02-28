package com.clothingswap.repository;

import com.clothingswap.model.ClothingItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClothingItemRepository extends JpaRepository<ClothingItem, Long> {
    List<ClothingItem> findByUserId(Long userId);
    List<ClothingItem> findByCampusAndUserIdNot(String campus, Long userId);
}
