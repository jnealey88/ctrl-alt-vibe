import jsPDF from 'jspdf';

interface PdfGenerationOptions {
  title?: string;
  filename?: string; 
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
}

/**
 * Generates a PDF from the vibe check evaluation results
 */
export async function generateVibeCheckPdf(
  evaluationResult: any,
  options: PdfGenerationOptions = {}
): Promise<void> {
  const {
    title = 'Vibe Check Results',
    filename = 'vibe-check-report.pdf',
    pageSize = 'a4',
    orientation = 'portrait'
  } = options;

  try {
    // Create PDF document
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    });
    
    // Add title
    pdf.setFontSize(22);
    pdf.setTextColor(33, 33, 33);
    pdf.text(title, 20, 20);
    
    // Add creation date
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 28);
    
    // Add vibe score
    if (evaluationResult.fitScore) {
      pdf.setFontSize(16);
      pdf.setTextColor(75, 75, 75);
      pdf.text(`Vibe Score: ${evaluationResult.fitScore}/100`, 20, 38);
    }

    // Process content sections
    let yPosition = 50;
    
    // Market Fit Section
    pdf.setFontSize(18);
    pdf.setTextColor(0, 102, 204);
    pdf.text('Market Fit Analysis', 20, yPosition);
    yPosition += 10;
    
    if (evaluationResult.marketFitAnalysis?.strengths?.length > 0) {
      pdf.setFontSize(14);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Strengths', 20, yPosition);
      yPosition += 7;
      
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      
      for (const strength of evaluationResult.marketFitAnalysis.strengths) {
        if (typeof strength === 'string') {
          const lines = pdf.splitTextToSize(`• ${strength}`, 170);
          pdf.text(lines, 25, yPosition);
          yPosition += (lines.length * 6);
          
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
        }
      }
      yPosition += 5;
    }
    
    if (evaluationResult.marketFitAnalysis?.weaknesses?.length > 0) {
      pdf.setFontSize(14);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Areas for Improvement', 20, yPosition);
      yPosition += 7;
      
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      
      for (const weakness of evaluationResult.marketFitAnalysis.weaknesses) {
        if (typeof weakness === 'string') {
          const lines = pdf.splitTextToSize(`• ${weakness}`, 170);
          pdf.text(lines, 25, yPosition);
          yPosition += (lines.length * 6);
          
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
        }
      }
      yPosition += 5;
    }
    
    if (evaluationResult.valueProposition) {
      pdf.addPage();
      yPosition = 20;
      
      pdf.setFontSize(18);
      pdf.setTextColor(0, 102, 204);
      pdf.text('Value Proposition', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      
      const vpText = evaluationResult.valueProposition || '';
      const vpLines = pdf.splitTextToSize(`"${vpText}"`, 170);
      pdf.text(vpLines, 25, yPosition);
    }
    
    // Target Audience Section
    pdf.addPage();
    yPosition = 20;
    
    pdf.setFontSize(18);
    pdf.setTextColor(0, 102, 204);
    pdf.text('Target Audience', 20, yPosition);
    yPosition += 10;
    
    if (evaluationResult.targetAudience) {
      if (evaluationResult.targetAudience.demographic) {
        pdf.setFontSize(14);
        pdf.setTextColor(51, 51, 51);
        pdf.text('Demographics', 20, yPosition);
        yPosition += 7;
        
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        const demoText = evaluationResult.targetAudience.demographic || '';
        const demoLines = pdf.splitTextToSize(demoText, 170);
        pdf.text(demoLines, 25, yPosition);
        yPosition += (demoLines.length * 6);
      }
      
      yPosition += 5;
      
      if (evaluationResult.targetAudience.psychographic) {
        pdf.setFontSize(14);
        pdf.setTextColor(51, 51, 51);
        pdf.text('Psychographics', 20, yPosition);
        yPosition += 7;
        
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        const psychoText = evaluationResult.targetAudience.psychographic || '';
        const psychoLines = pdf.splitTextToSize(psychoText, 170);
        pdf.text(psychoLines, 25, yPosition);
      }
    }
    
    // Competitive Landscape
    if (evaluationResult.competitiveLandscape?.competitors?.length > 0) {
      pdf.addPage();
      yPosition = 20;
      
      pdf.setFontSize(18);
      pdf.setTextColor(0, 102, 204);
      pdf.text('Competitive Landscape', 20, yPosition);
      yPosition += 10;
      
      for (const competitor of evaluationResult.competitiveLandscape.competitors) {
        pdf.setFontSize(14);
        pdf.setTextColor(51, 51, 51);
        pdf.text(competitor.name || 'Competitor', 20, yPosition);
        yPosition += 7;
        
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        const diffText = competitor.differentiation || '';
        const diffLines = pdf.splitTextToSize(diffText, 170);
        pdf.text(diffLines, 25, yPosition);
        yPosition += (diffLines.length * 6) + 10;
        
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
      }
    }
    
    // Risks Section
    if (evaluationResult.riskAssessment?.risks?.length > 0) {
      pdf.addPage();
      yPosition = 20;
      
      pdf.setFontSize(18);
      pdf.setTextColor(0, 102, 204);
      pdf.text('Risk Assessment', 20, yPosition);
      yPosition += 10;
      
      for (const risk of evaluationResult.riskAssessment.risks) {
        pdf.setFontSize(14);
        pdf.setTextColor(211, 47, 47);
        pdf.text(risk.type || 'Risk', 20, yPosition);
        yPosition += 7;
        
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        const descText = risk.description || '';
        const descLines = pdf.splitTextToSize(descText, 170);
        pdf.text(descLines, 25, yPosition);
        yPosition += (descLines.length * 6) + 5;
        
        pdf.setFontSize(11);
        pdf.setTextColor(0, 102, 0);
        pdf.text('Mitigation:', 25, yPosition);
        yPosition += 5;
        
        pdf.setTextColor(60, 60, 60);
        const mitigationText = risk.mitigation || '';
        const mitigationLines = pdf.splitTextToSize(mitigationText, 165);
        pdf.text(mitigationLines, 30, yPosition);
        yPosition += (mitigationLines.length * 6) + 10;
        
        if (yPosition > 250 && evaluationResult.riskAssessment.risks.indexOf(risk) !== evaluationResult.riskAssessment.risks.length - 1) {
          pdf.addPage();
          yPosition = 20;
        }
      }
    }
    
    // Business Plan
    if (evaluationResult.businessPlan) {
      pdf.addPage();
      yPosition = 20;
      
      pdf.setFontSize(18);
      pdf.setTextColor(0, 102, 204);
      pdf.text('Business Plan', 20, yPosition);
      yPosition += 10;
      
      if (evaluationResult.businessPlan.revenueModel) {
        pdf.setFontSize(14);
        pdf.setTextColor(51, 51, 51);
        pdf.text('Revenue Model', 20, yPosition);
        yPosition += 7;
        
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        const revenueText = evaluationResult.businessPlan.revenueModel || '';
        const revenueLines = pdf.splitTextToSize(revenueText, 170);
        pdf.text(revenueLines, 25, yPosition);
        yPosition += (revenueLines.length * 6) + 10;
      }
      
      if (evaluationResult.businessPlan.goToMarket) {
        pdf.setFontSize(14);
        pdf.setTextColor(51, 51, 51);
        pdf.text('Go-To-Market Strategy', 20, yPosition);
        yPosition += 7;
        
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        const gtmText = evaluationResult.businessPlan.goToMarket || '';
        const gtmLines = pdf.splitTextToSize(gtmText, 170);
        pdf.text(gtmLines, 25, yPosition);
        yPosition += (gtmLines.length * 6) + 10;
      }
      
      if (evaluationResult.businessPlan.milestones?.length > 0) {
        pdf.setFontSize(14);
        pdf.setTextColor(51, 51, 51);
        pdf.text('Key Milestones', 20, yPosition);
        yPosition += 7;
        
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        
        for (let i = 0; i < evaluationResult.businessPlan.milestones.length; i++) {
          const milestone = evaluationResult.businessPlan.milestones[i];
          if (typeof milestone === 'string') {
            const milestoneLines = pdf.splitTextToSize(`${i + 1}. ${milestone}`, 170);
            pdf.text(milestoneLines, 25, yPosition);
            yPosition += (milestoneLines.length * 6) + 3;
            
            if (yPosition > 270 && i < evaluationResult.businessPlan.milestones.length - 1) {
              pdf.addPage();
              yPosition = 20;
            }
          }
        }
      }
    }
    
    // Final page with summary
    pdf.addPage();
    yPosition = 20;
    
    pdf.setFontSize(18);
    pdf.setTextColor(0, 102, 204);
    pdf.text('Summary', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Fit Score: ' + (evaluationResult.fitScore || 'N/A'), 20, yPosition);
    yPosition += 7;
    
    if (evaluationResult.fitScoreExplanation) {
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      const scoreText = evaluationResult.fitScoreExplanation || '';
      const scoreLines = pdf.splitTextToSize(scoreText, 170);
      pdf.text(scoreLines, 25, yPosition);
      yPosition += (scoreLines.length * 6) + 10;
    }
    
    // Add a final attribution
    yPosition += 15;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Generated by Vibe Check - AI-powered business evaluation tool', 20, yPosition);
    yPosition += 5;
    pdf.text('This evaluation is for informational purposes only and should not replace professional business advice.', 20, yPosition);
    
    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}