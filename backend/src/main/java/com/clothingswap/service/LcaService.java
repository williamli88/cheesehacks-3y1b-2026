package com.clothingswap.service;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class LcaService {

    private static final double SHIPPING_CO2 = 0.2;
    private static final double SHIPPING_WATER = 50.0;

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

    public record LcaResult(double waterSaved, double co2Saved) {}

    public LcaResult calculateSavings(String category) {
        double[] values = LCA_VALUES.getOrDefault(
            category != null ? category.toUpperCase() : "",
            new double[]{3000, 3.0}
        );
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
}
