package com.clothingswap.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LcaServiceTest {

    private final LcaService lcaService = new LcaService();

    @Test
    void calculatesCategorySavingsWithShippingAdjustment() {
        LcaService.LcaResult result = lcaService.calculateSavings("TSHIRT");
        // (2700 * 0.5) - 50 = 1300
        // (2.0 * 0.5) - 0.2 = 0.8
        assertEquals(1300.0, result.waterSaved(), 0.0001);
        assertEquals(0.8, result.co2Saved(), 0.0001);
    }

    @Test
    void calculatesClothingTypeSavingsWhenCategoryIsGeneric() {
        LcaService.LcaResult result = lcaService.calculateSavings("TOPS", "TOPS");
        // TOPS blended values: water=3900, co2=3.17
        // (3900 * 0.5) - 50 = 1900
        // (3.17 * 0.5) - 0.2 = 1.385
        assertEquals(1900.0, result.waterSaved(), 0.0001);
        assertEquals(1.385, result.co2Saved(), 0.0001);
    }
}
