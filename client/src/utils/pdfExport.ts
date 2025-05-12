import jsPDF from 'jspdf';

interface PdfGenerationOptions {
  title?: string;
  filename?: string; 
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
}

/**
 * Generates a PDF from the vibe check evaluation results
 * Optimized to combine sections efficiently and preserve visual styling
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
    
    // Define some styling constants
    const pageWidth = orientation === 'portrait' ? 210 : 297;
    const contentWidth = pageWidth - 40; // 20mm margins on each side
    const maxY = 275; // Max Y position before forcing a new page
    const sectionSpacing = 15; // Space between major sections
    const subsectionSpacing = 8; // Space between subsections
    const lineHeight = 6; // Line height for normal text
    const bulletLeftPadding = 5; // Left padding for bullet points
    
    // Helper function to check if we need a new page and add it
    const checkForNewPage = (currentY: number, requiredSpace: number = 20): number => {
      if (currentY + requiredSpace > maxY) {
        pdf.addPage();
        return 20; // Reset to top of page with margin
      }
      return currentY;
    };
    
    // Add title and header
    pdf.setFontSize(24);
    pdf.setTextColor(33, 33, 33);
    pdf.text(title, 20, 20);
    
    // Add creation date
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Add vibe score with custom styling
    if (evaluationResult.fitScore) {
      // Add a colored rectangle for the score
      pdf.setDrawColor(70, 130, 180); // Steel blue
      pdf.setFillColor(240, 248, 255); // Alice blue
      pdf.roundedRect(20, 35, 60, 20, 3, 3, 'FD');
      
      pdf.setFontSize(14);
      pdf.setTextColor(70, 130, 180); // Steel blue
      pdf.text('Vibe Score:', 25, 45);
      
      pdf.setFontSize(16);
      pdf.setTextColor(70, 130, 180);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${evaluationResult.fitScore}/100`, 65, 45);
      pdf.setFont(undefined, 'normal');
    }
    
    let yPosition = 65; // Start of content after header
    
    // 1. MARKET FIT SECTION
    yPosition = renderSectionHeader(pdf, 'Market Fit Analysis', yPosition);
    
    // Strengths
    if (evaluationResult.marketFitAnalysis?.strengths?.length > 0) {
      // Add a light background for the strengths section
      pdf.setFillColor(240, 255, 240); // Very light green
      pdf.roundedRect(20, yPosition, contentWidth, 10 + (evaluationResult.marketFitAnalysis.strengths.length * 6), 2, 2, 'F');
      
      yPosition += 3;
      
      // Strengths header with colored icon
      pdf.setFontSize(14);
      pdf.setTextColor(46, 125, 50); // Green
      pdf.setFont(undefined, 'bold');
      pdf.text('✓ Strengths', 25, yPosition);
      pdf.setFont(undefined, 'normal');
      yPosition += 8;
      
      // List strengths
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      
      for (const strength of evaluationResult.marketFitAnalysis.strengths) {
        if (typeof strength === 'string') {
          yPosition = checkForNewPage(yPosition);
          
          const lines = pdf.splitTextToSize(`• ${strength}`, contentWidth - 10);
          pdf.text(lines, 30, yPosition);
          yPosition += (lines.length * lineHeight);
        }
      }
      
      yPosition += subsectionSpacing;
    }
    
    // Weaknesses
    if (evaluationResult.marketFitAnalysis?.weaknesses?.length > 0) {
      yPosition = checkForNewPage(yPosition, 15);
      
      // Add a light background for the weaknesses section
      pdf.setFillColor(255, 248, 240); // Very light amber
      pdf.roundedRect(20, yPosition, contentWidth, 10 + (evaluationResult.marketFitAnalysis.weaknesses.length * 6), 2, 2, 'F');
      
      yPosition += 3;
      
      // Weaknesses header with colored icon
      pdf.setFontSize(14);
      pdf.setTextColor(211, 47, 47); // Red
      pdf.setFont(undefined, 'bold');
      pdf.text('! Areas for Improvement', 25, yPosition);
      pdf.setFont(undefined, 'normal');
      yPosition += 8;
      
      // List weaknesses
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      
      for (const weakness of evaluationResult.marketFitAnalysis.weaknesses) {
        if (typeof weakness === 'string') {
          yPosition = checkForNewPage(yPosition);
          
          const lines = pdf.splitTextToSize(`• ${weakness}`, contentWidth - 10);
          pdf.text(lines, 30, yPosition);
          yPosition += (lines.length * lineHeight);
        }
      }
      
      yPosition += subsectionSpacing;
    }
    
    // Value Proposition (if it fits on current page)
    if (evaluationResult.valueProposition) {
      yPosition = checkForNewPage(yPosition, 40); // Check if we need a new page
      
      // Subsection header
      pdf.setFontSize(14);
      pdf.setTextColor(51, 51, 51);
      pdf.setFont(undefined, 'bold');
      pdf.text('Value Proposition', 20, yPosition);
      pdf.setFont(undefined, 'normal');
      yPosition += 8;
      
      // Style the value proposition as a quote
      const vpText = evaluationResult.valueProposition || '';
      
      // Add a quote box with styled border
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(248, 248, 255); // Very light lavender
      
      const vpLines = pdf.splitTextToSize(`"${vpText}"`, contentWidth - 15);
      const quoteHeight = (vpLines.length * lineHeight) + 10;
      
      // Draw a styled quote box
      pdf.roundedRect(25, yPosition - 5, contentWidth - 10, quoteHeight, 3, 3, 'FD');
      
      // Add a vertical line for quote styling
      pdf.setDrawColor(120, 150, 180);
      pdf.setLineWidth(1.5);
      pdf.line(30, yPosition - 3, 30, yPosition + quoteHeight - 7);
      pdf.setLineWidth(0.5);
      
      // Add the text
      pdf.setFontSize(11);
      pdf.setTextColor(70, 70, 70);
      pdf.setFont(undefined, 'italic');
      pdf.text(vpLines, 35, yPosition + 3);
      pdf.setFont(undefined, 'normal');
      
      yPosition += quoteHeight + subsectionSpacing;
    }
    
    // 2. TARGET AUDIENCE SECTION (on same page if there's room)
    yPosition = checkForNewPage(yPosition, 60);
    
    // Add a separator line
    pdf.setDrawColor(220, 220, 220);
    pdf.line(20, yPosition - subsectionSpacing/2, pageWidth - 20, yPosition - subsectionSpacing/2);
    
    yPosition = renderSectionHeader(pdf, 'Target Audience', yPosition);
    
    if (evaluationResult.targetAudience) {
      // Demographics
      if (evaluationResult.targetAudience.demographic) {
        pdf.setFontSize(14);
        pdf.setTextColor(51, 51, 51);
        pdf.setFont(undefined, 'bold');
        pdf.text('Demographics', 20, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 8;
        
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        
        const demoText = evaluationResult.targetAudience.demographic || '';
        const demoLines = pdf.splitTextToSize(demoText, contentWidth);
        pdf.text(demoLines, 25, yPosition);
        yPosition += (demoLines.length * lineHeight) + subsectionSpacing;
      }
      
      // Psychographics (check if fits on current page)
      if (evaluationResult.targetAudience.psychographic) {
        yPosition = checkForNewPage(yPosition, 40);
        
        pdf.setFontSize(14);
        pdf.setTextColor(51, 51, 51);
        pdf.setFont(undefined, 'bold');
        pdf.text('Psychographics', 20, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 8;
        
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        
        const psychoText = evaluationResult.targetAudience.psychographic || '';
        const psychoLines = pdf.splitTextToSize(psychoText, contentWidth);
        pdf.text(psychoLines, 25, yPosition);
        yPosition += (psychoLines.length * lineHeight) + subsectionSpacing;
      }
    }
    
    // 3. COMPETITIVE LANDSCAPE
    if (evaluationResult.competitiveLandscape?.competitors?.length > 0) {
      yPosition = checkForNewPage(yPosition, 60);
      
      // Add a separator line
      pdf.setDrawColor(220, 220, 220);
      pdf.line(20, yPosition - subsectionSpacing/2, pageWidth - 20, yPosition - subsectionSpacing/2);
      
      yPosition = renderSectionHeader(pdf, 'Competitive Landscape', yPosition);
      
      // Market Positioning if available
      if (evaluationResult.competitiveLandscape.marketPositioning) {
        const posText = evaluationResult.competitiveLandscape.marketPositioning || '';
        const posLines = pdf.splitTextToSize(posText, contentWidth);
        
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        pdf.text(posLines, 25, yPosition);
        yPosition += (posLines.length * lineHeight) + subsectionSpacing;
      }
      
      // Competitors
      for (const competitor of evaluationResult.competitiveLandscape.competitors) {
        yPosition = checkForNewPage(yPosition, 35);
        
        // Add a competitor card with styling
        pdf.setFillColor(245, 245, 250);
        pdf.setDrawColor(220, 220, 230);
        const competitorCardStart = yPosition - 5;
        
        // First render the content to calculate total height
        let contentHeight = 0;
        
        // Name and content calculations
        pdf.setFontSize(13);
        const competitorName = competitor.name || 'Competitor';
        contentHeight += 8;
        
        // Differentiation
        const diffText = competitor.differentiation || '';
        const diffLines = pdf.splitTextToSize(diffText, contentWidth - 15);
        contentHeight += (diffLines.length * lineHeight) + 5;
        
        // Strengths & weaknesses (if available)
        if (competitor.strengths || competitor.weaknesses) {
          contentHeight += 20; // Headers
          
          if (competitor.strengths?.length > 0) {
            for (const strength of competitor.strengths) {
              if (typeof strength === 'string') {
                const strengthLines = pdf.splitTextToSize(`• ${strength}`, (contentWidth/2) - 15);
                contentHeight = Math.max(contentHeight, (strengthLines.length * 5) + 20);
              }
            }
          }
          
          if (competitor.weaknesses?.length > 0) {
            for (const weakness of competitor.weaknesses) {
              if (typeof weakness === 'string') {
                const weaknessLines = pdf.splitTextToSize(`• ${weakness}`, (contentWidth/2) - 15);
                contentHeight = Math.max(contentHeight, (weaknessLines.length * 5) + 20);
              }
            }
          }
        }
        
        // Now draw the card
        pdf.roundedRect(20, competitorCardStart, contentWidth, contentHeight + 10, 3, 3, 'FD');
        
        // Draw competitor name with styling
        pdf.setFontSize(13);
        pdf.setTextColor(0, 70, 120);
        pdf.setFont(undefined, 'bold');
        pdf.text(competitorName, 25, yPosition);
        pdf.setFont(undefined, 'normal');
        
        // Add market position if available
        if (competitor.marketPosition) {
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          const posText = `(${competitor.marketPosition})`;
          const nameWidth = pdf.getTextWidth(competitorName);
          pdf.text(posText, 30 + nameWidth, yPosition);
        }
        
        yPosition += 8;
        
        // Add differentiation
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        pdf.text(diffLines, 25, yPosition);
        yPosition += (diffLines.length * lineHeight) + 5;
        
        // Strengths & weaknesses in two columns if available
        if (competitor.strengths || competitor.weaknesses) {
          // Create two columns side by side
          const colWidth = (contentWidth / 2) - 10;
          let startY = yPosition;
          
          // Left column: Strengths
          if (competitor.strengths?.length > 0) {
            pdf.setFontSize(11);
            pdf.setTextColor(46, 125, 50); // Green
            pdf.setFont(undefined, 'bold');
            pdf.text('Strengths:', 25, yPosition);
            pdf.setFont(undefined, 'normal');
            yPosition += 5;
            
            pdf.setFontSize(10);
            pdf.setTextColor(60, 60, 60);
            
            for (const strength of competitor.strengths) {
              if (typeof strength === 'string') {
                const strengthLines = pdf.splitTextToSize(`• ${strength}`, colWidth);
                pdf.text(strengthLines, 25, yPosition);
                yPosition += (strengthLines.length * 5);
              }
            }
          }
          
          // Reset Y for right column
          yPosition = startY;
          
          // Right column: Weaknesses
          if (competitor.weaknesses?.length > 0) {
            const rightColumnX = 25 + contentWidth/2;
            
            pdf.setFontSize(11);
            pdf.setTextColor(211, 47, 47); // Red
            pdf.setFont(undefined, 'bold');
            pdf.text('Weaknesses:', rightColumnX, yPosition);
            pdf.setFont(undefined, 'normal');
            yPosition += 5;
            
            pdf.setFontSize(10);
            pdf.setTextColor(60, 60, 60);
            
            for (const weakness of competitor.weaknesses) {
              if (typeof weakness === 'string') {
                const weaknessLines = pdf.splitTextToSize(`• ${weakness}`, colWidth);
                pdf.text(weaknessLines, rightColumnX, yPosition);
                yPosition += (weaknessLines.length * 5);
              }
            }
          }
          
          // Use the maximum height from either column
          yPosition = Math.max(yPosition, startY + contentHeight - 30);
        }
        
        // Add pricing strategy if available
        if (competitor.pricingStrategy) {
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont(undefined, 'bold');
          pdf.text('Pricing Strategy:', 25, yPosition + 5);
          pdf.setFont(undefined, 'normal');
          
          pdf.setTextColor(60, 60, 60);
          const priceText = competitor.pricingStrategy || '';
          const priceLines = pdf.splitTextToSize(priceText, contentWidth - 15);
          pdf.text(priceLines, 25, yPosition + 10);
          yPosition += (priceLines.length * 5) + 5;
        }
        
        yPosition += 15; // Space after competitor card
      }
    }
    
    // 4. RISKS SECTION
    if (evaluationResult.riskAssessment?.risks?.length > 0) {
      yPosition = checkForNewPage(yPosition, 50);
      
      // Add a separator line
      pdf.setDrawColor(220, 220, 220);
      pdf.line(20, yPosition - subsectionSpacing/2, pageWidth - 20, yPosition - subsectionSpacing/2);
      
      yPosition = renderSectionHeader(pdf, 'Risk Assessment', yPosition);
      
      if (evaluationResult.fitScoreExplanation) {
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        
        const scoreText = evaluationResult.fitScoreExplanation || '';
        const scoreLines = pdf.splitTextToSize(scoreText, contentWidth);
        pdf.text(scoreLines, 25, yPosition);
        yPosition += (scoreLines.length * lineHeight) + subsectionSpacing;
      }
      
      // Draw each risk in a card
      for (const risk of evaluationResult.riskAssessment.risks) {
        yPosition = checkForNewPage(yPosition, 40);
        
        // Create a risk card with styling
        pdf.setFillColor(255, 246, 245); // Very light red
        pdf.setDrawColor(245, 220, 220);
        
        // Calculate content height first
        let riskContentHeight = 0;
        
        // Title
        riskContentHeight += 8;
        
        // Description
        const descText = risk.description || '';
        const descLines = pdf.splitTextToSize(descText, contentWidth - 15);
        riskContentHeight += (descLines.length * lineHeight) + 5;
        
        // Mitigation
        const mitigationText = risk.mitigation || '';
        const mitigationLines = pdf.splitTextToSize(mitigationText, contentWidth - 20);
        riskContentHeight += (mitigationLines.length * lineHeight) + 10;
        
        // Draw the card
        pdf.roundedRect(20, yPosition - 5, contentWidth, riskContentHeight + 10, 3, 3, 'FD');
        
        // Draw risk type with styling
        pdf.setFontSize(13);
        pdf.setTextColor(211, 47, 47); // Red
        pdf.setFont(undefined, 'bold');
        pdf.text(risk.type || 'Risk', 25, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 8;
        
        // Description
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        pdf.text(descLines, 25, yPosition);
        yPosition += (descLines.length * lineHeight) + 5;
        
        // Mitigation with green styling
        pdf.setFontSize(11);
        pdf.setTextColor(46, 125, 50); // Green
        pdf.setFont(undefined, 'bold');
        pdf.text('Mitigation Strategy:', 25, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 5;
        
        // Mitigation details
        pdf.setTextColor(60, 60, 60);
        pdf.text(mitigationLines, 30, yPosition);
        yPosition += (mitigationLines.length * lineHeight) + 10;
      }
    }
    
    // 5. BUSINESS PLAN SECTION
    if (evaluationResult.businessPlan) {
      yPosition = checkForNewPage(yPosition, 60);
      
      // Add a separator line
      pdf.setDrawColor(220, 220, 220);
      pdf.line(20, yPosition - subsectionSpacing/2, pageWidth - 20, yPosition - subsectionSpacing/2);
      
      yPosition = renderSectionHeader(pdf, 'Business Plan', yPosition);
      
      // Revenue Model
      if (evaluationResult.businessPlan.revenueModel) {
        pdf.setFontSize(14);
        pdf.setTextColor(51, 51, 51);
        pdf.setFont(undefined, 'bold');
        pdf.text('Revenue Model', 20, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 8;
        
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        
        const revenueText = evaluationResult.businessPlan.revenueModel || '';
        const revenueLines = pdf.splitTextToSize(revenueText, contentWidth);
        pdf.text(revenueLines, 25, yPosition);
        yPosition += (revenueLines.length * lineHeight) + subsectionSpacing;
      }
      
      // Go-To-Market
      if (evaluationResult.businessPlan.goToMarket) {
        yPosition = checkForNewPage(yPosition, 40);
        
        pdf.setFontSize(14);
        pdf.setTextColor(51, 51, 51);
        pdf.setFont(undefined, 'bold');
        pdf.text('Go-To-Market Strategy', 20, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 8;
        
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        
        const gtmText = evaluationResult.businessPlan.goToMarket || '';
        const gtmLines = pdf.splitTextToSize(gtmText, contentWidth);
        pdf.text(gtmLines, 25, yPosition);
        yPosition += (gtmLines.length * lineHeight) + subsectionSpacing;
      }
      
      // Milestones
      if (evaluationResult.businessPlan.milestones?.length > 0) {
        yPosition = checkForNewPage(yPosition, 40);
        
        pdf.setFontSize(14);
        pdf.setTextColor(51, 51, 51);
        pdf.setFont(undefined, 'bold');
        pdf.text('Key Milestones', 20, yPosition);
        pdf.setFont(undefined, 'normal');
        yPosition += 8;
        
        // Style the milestones as a timeline
        pdf.setFontSize(11);
        pdf.setDrawColor(180, 200, 230); // Light blue
        pdf.setFillColor(240, 248, 255); // Alice blue
        
        const milestoneStartY = yPosition;
        
        // Draw a vertical timeline line
        pdf.setLineWidth(0.8);
        pdf.line(30, milestoneStartY, 30, milestoneStartY + (evaluationResult.businessPlan.milestones.length * 15));
        pdf.setLineWidth(0.5);
        
        for (let i = 0; i < evaluationResult.businessPlan.milestones.length; i++) {
          yPosition = checkForNewPage(yPosition, 20);
          
          const milestone = evaluationResult.businessPlan.milestones[i];
          if (typeof milestone === 'string') {
            // Draw milestone circle marker
            pdf.setFillColor(70, 130, 180);
            pdf.circle(30, yPosition - 1, 3, 'F');
            
            // Draw milestone text
            pdf.setTextColor(60, 60, 60);
            const milestoneLines = pdf.splitTextToSize(milestone, contentWidth - 20);
            pdf.text(milestoneLines, 40, yPosition);
            yPosition += (milestoneLines.length * lineHeight) + 5;
          }
        }
      }
    }
    
    // Add a page for Launch Strategy if space needed
    if (evaluationResult.launchStrategy && (yPosition > 200)) {
      pdf.addPage();
      yPosition = 20;
    }
    
    // 6. LAUNCH STRATEGY AND BOOTSTRAP GUIDE COMBINED
    let launchSectionDrawn = false;
    
    if (evaluationResult.launchStrategy && evaluationResult.launchStrategy.mvpFeatures?.length > 0) {
      yPosition = checkForNewPage(yPosition, 50);
      
      if (!launchSectionDrawn) {
        // Add a separator line
        pdf.setDrawColor(220, 220, 220);
        pdf.line(20, yPosition - subsectionSpacing/2, pageWidth - 20, yPosition - subsectionSpacing/2);
        
        yPosition = renderSectionHeader(pdf, 'Launch Strategy', yPosition);
        launchSectionDrawn = true;
      }
      
      // MVP Features
      pdf.setFontSize(14);
      pdf.setTextColor(51, 51, 51);
      pdf.setFont(undefined, 'bold');
      pdf.text('MVP Features', 20, yPosition);
      pdf.setFont(undefined, 'normal');
      yPosition += 8;
      
      // Style MVP features as a checklist
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      
      for (let i = 0; i < evaluationResult.launchStrategy.mvpFeatures.length; i++) {
        yPosition = checkForNewPage(yPosition, 20);
        
        const feature = evaluationResult.launchStrategy.mvpFeatures[i];
        if (typeof feature === 'string') {
          // Draw a checkbox
          pdf.setDrawColor(150, 150, 150);
          pdf.rect(25, yPosition - 4, 5, 5);
          
          // Feature text
          const featureLines = pdf.splitTextToSize(feature, contentWidth - 25);
          pdf.text(featureLines, 35, yPosition);
          yPosition += (featureLines.length * lineHeight) + 3;
        }
      }
      
      yPosition += subsectionSpacing;
    }
    
    // 7. ATTRIBUTION FOOTER
    // Add to the last page
    const footerY = maxY - 20;
    
    // Draw a subtle line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, footerY, pageWidth - 20, footerY);
    
    // Add attribution text
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.text('Generated by Vibe Check - AI-powered business evaluation tool', 20, footerY + 7);
    pdf.text('This evaluation is for informational purposes only and should not replace professional business advice.', 20, footerY + 13);
    
    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Helper function to render a section header with consistent styling
 */
function renderSectionHeader(pdf: jsPDF, title: string, yPosition: number): number {
  // Section title with styling
  pdf.setFillColor(245, 250, 255); // Very light blue
  pdf.roundedRect(15, yPosition - 5, 180, 10, 1, 1, 'F');
  
  pdf.setFontSize(16);
  pdf.setTextColor(0, 102, 204); // Blue
  pdf.setFont(undefined, 'bold');
  pdf.text(title, 20, yPosition);
  pdf.setFont(undefined, 'normal');
  
  return yPosition + 12; // Return updated position after header
}