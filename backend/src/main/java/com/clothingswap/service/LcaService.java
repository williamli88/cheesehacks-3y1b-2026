package com.clothingswap.service;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class LcaService {

    private static final double SHIPPING_CO2 = 0.2;
    private static final double SHIPPING_WATER = 50.0;
    private static final double[] DEFAULT_VALUES = new double[]{3000, 3.0};

    private static final Map<String, double[]> LCA_VALUES = Map.of(
        "TSHIRT",  new double[]{2700,  2.0},
        "JEANS",   new double[]{7600,  5.0},
        "JACKET",  new double[]{10000, 8.0},
        "DRESS",   new double[]{5000,  4.0},
        "SHOES",   new double[]{8000,  6.0},
        "SWEATER", new double[]{4000,  3.5},
        "SKIRT",   new double[]{3500,  3.0},
        "SHORTS",  new double[]{3000,  2.5}
    );

    // Support the new upload taxonomy (TOPS/BOTTOMS/OUTERWEAR/FOOTWEAR/ACCESSORIES)
    // with blended factors from the category-level values above.
    private static final Map<String, double[]> CLOTHING_TYPE_VALUES = Map.of(
        "TOPS",      new double[]{3900, 3.17}, // avg(TSHIRT, DRESS, SWEATER)
        "BOTTOMS",   new double[]{4700, 3.50}, // avg(JEANS, SKIRT, SHORTS)
        "OUTERWEAR", new double[]{10000, 8.0},
        "FOOTWEAR",  new double[]{8000, 6.0},
        "ACCESSORIES", new double[]{2000, 1.5}
    );

    public record LcaResult(double waterSaved, double co2Saved) {}

    public LcaResult calculateSavings(String category) {
        double[] values = resolveValues(category, null);
        double waterSaved = (values[0] * 0.5) - SHIPPING_WATER;
        double co2Saved   = (values[1] * 0.5) - SHIPPING_CO2;
        return new LcaResult(Math.max(0, waterSaved), Math.max(0, co2Saved));
    }

    public LcaResult calculateSavings(String category, String clothingType) {
        double[] values = resolveValues(category, clothingType);
        double waterSaved = (values[0] * 0.5) - SHIPPING_WATER;
        double co2Saved   = (values[1] * 0.5) - SHIPPING_CO2;
        return new LcaResult(Math.max(0, waterSaved), Math.max(0, co2Saved));
    }

    public Map<String, Object> getTranslatedImpact(double totalWaterSaved, double totalCo2Saved, int totalSwaps) {
        double treesEquivalent = totalCo2Saved / 21.0;
        double showersSaved = totalWaterSaved / 65.0;
        double milesNotDriven = totalCo2Saved / 0.404;

        return Map.of(
            "totalWaterSaved", totalWaterSaved,
            "totalCo2Saved", totalCo2Saved,
            "totalSwapsCompleted", totalSwaps,
            "treesEquivalent", Math.round(treesEquivalent * 100.0) / 100.0,
            "showersSaved", Math.round(showersSaved * 100.0) / 100.0,
            "milesNotDriven", Math.round(milesNotDriven * 100.0) / 100.0
        );
    }

    private double[] resolveValues(String category, String clothingType) {
        String categoryKey = category != null ? category.toUpperCase() : "";
        if (LCA_VALUES.containsKey(categoryKey)) {
            return LCA_VALUES.get(categoryKey);
        }

        String typeKey = clothingType != null ? clothingType.toUpperCase() : "";
        if (CLOTHING_TYPE_VALUES.containsKey(typeKey)) {
            return CLOTHING_TYPE_VALUES.get(typeKey);
        }

        return DEFAULT_VALUES;
    }
}
