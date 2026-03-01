package com.clothingswap.repository;

import com.clothingswap.model.SwipeLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SwipeLedgerRepository extends JpaRepository<SwipeLedger, Long> {
    List<SwipeLedger> findByUserIdFromAndAction(Long userIdFrom, String action);
    Optional<SwipeLedger> findByUserIdFromAndItemIdTo(Long userIdFrom, Long itemIdTo);
    List<SwipeLedger> findByUserIdFrom(Long userIdFrom);
    void deleteByItemIdTo(Long itemIdTo);
}
