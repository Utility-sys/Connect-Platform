/**
 * verificationService.js
 * Simulates an AI-based document verification engine.
 * In a real-world scenario, this would integrate with OCR/Computer Vision APIs.
 */

exports.verifyDocument = async (filePath, expectedType) => {
  return new Promise((resolve) => {
    console.log(`🔍 [AI Trust Engine] Analyzing document: ${filePath} (Expected: ${expectedType})`);
    
    // Simulate processing delay
    setTimeout(() => {
      // ── Enhanced Mock Logic ────────────────────────────────────────────────
      // We simulate checking for "green background" for NIC 
      // or "legal structure" for BR.
      
      const isClear = Math.random() > 0.1; // 90% chance of clear image
      let confidence = 0;
      let analysis = "";

      if (expectedType === 'NIC') {
        const matchesVisualPattern = Math.random() > 0.15; // 85% chance it looks like the green NIC
        confidence = matchesVisualPattern ? (88 + Math.random() * 10) : (45 + Math.random() * 15);
        analysis = matchesVisualPattern 
          ? "✅ Matches Sri Lankan NIC pattern: High confidence green-background identification."
          : "⚠️ Visual Mismatch: Document background does not match the standard green NIC pattern.";
      } else if (expectedType === 'BR') {
        const matchesVisualPattern = Math.random() > 0.1; 
        confidence = matchesVisualPattern ? (92 + Math.random() * 8) : (50 + Math.random() * 10);
        analysis = matchesVisualPattern
          ? "✅ Matches Business Registration pattern: Red seal and header detected."
          : "❌ Layout Variance: Document lacks standard corporate registration headers.";
      } else {
        confidence = 50;
        analysis = "Unknown document type provided. Basic character recognition only.";
      }

      if (!isClear) {
        confidence -= 20;
        analysis += " [Note: Image quality is low/blurry]";
      }
      
      const result = {
        confidence: parseFloat(Math.max(0, Math.min(100, confidence)).toFixed(2)),
        analysis: analysis
      };

      console.log(`✅ [AI Trust Engine] Identification Complete: ${result.confidence}% confidence.`);
      resolve(result);
    }, 1200); 
  });
};
