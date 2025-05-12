import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PdfGenerationOptions {
  title?: string;
  filename?: string; 
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
}

/**
 * Utility function to safely handle potentially undefined strings
 */
function safeString(text: any): string {
  if (text === undefined || text === null) return '';
  return String(text);
}

/**
 * Captures all tabs in the vibe check and generates a comprehensive PDF report
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

    // Start Y position for content
    let yPosition = 50;
    
    // Process each section
    yPosition = await processMarketFitSection(pdf, evaluationResult, yPosition);
    yPosition = await processAudienceSection(pdf, evaluationResult, yPosition);
    yPosition = await processTechnicalSection(pdf, evaluationResult, yPosition);
    yPosition = await processBusinessSection(pdf, evaluationResult, yPosition);
    yPosition = await processRevenueSection(pdf, evaluationResult, yPosition);
    yPosition = await processRisksSection(pdf, evaluationResult, yPosition);
    yPosition = await processCustomersSection(pdf, evaluationResult, yPosition);
    yPosition = await processLaunchSection(pdf, evaluationResult, yPosition);
    yPosition = await processBootstrappingSection(pdf, evaluationResult, yPosition);
    
    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Process Market Fit section for PDF
 */
async function processMarketFitSection(
  pdf: jsPDF,
  evaluationResult: any,
  yPosition: number
): Promise<number> {
  // Add page break if needed
  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 20;
  }

  // Section title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 102, 204); // Blue color for section headers
  pdf.text('Market Fit Analysis', 20, yPosition);
  yPosition += 10;
  
  // Strengths
  pdf.setFontSize(14);
  pdf.setTextColor(51, 51, 51);
  pdf.text('Strengths', 20, yPosition);
  yPosition += 7;
  
  // Add each strength
  pdf.setFontSize(11);
  pdf.setTextColor(60, 60, 60);
  
  if (evaluationResult.marketFitAnalysis?.strengths) {
    for (const strength of evaluationResult.marketFitAnalysis.strengths) {
      if (typeof strength === 'string') {
        const textLines = pdf.splitTextToSize(`• ${strength}`, 170);
        pdf.text(textLines, 25, yPosition);
        yPosition += textLines.length * 6;
        
        // Check if we need a new page
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
      }
    }
  }
  
  yPosition += 5;
  
  // Weaknesses
  pdf.setFontSize(14);
  pdf.setTextColor(51, 51, 51);
  pdf.text('Areas for Improvement', 20, yPosition);
  yPosition += 7;
  
  // Add each weakness
  pdf.setFontSize(11);
  pdf.setTextColor(60, 60, 60);
  
  if (evaluationResult.marketFitAnalysis?.weaknesses) {
    for (const weakness of evaluationResult.marketFitAnalysis.weaknesses) {
      if (typeof weakness === 'string') {
        const textLines = pdf.splitTextToSize(`• ${weakness}`, 170);
        pdf.text(textLines, 25, yPosition);
        yPosition += textLines.length * 6;
        
        // Check if we need a new page
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
      }
    }
  }
  
  yPosition += 5;
  
  // Demand Potential
  if (evaluationResult.marketFitAnalysis?.demandPotential) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Market Demand Potential', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const demandText = safeString(evaluationResult.marketFitAnalysis.demandPotential);
    const demandLines = pdf.splitTextToSize(demandText, 170);
    pdf.text(demandLines, 25, yPosition);
    yPosition += demandLines.length * 6;
  }
  
  // Value Proposition
  if (evaluationResult.valueProposition) {
    yPosition += 5;
    
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Value Proposition', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    
    // Add a quote style for value proposition
    pdf.setDrawColor(200, 200, 200);
    pdf.line(25, yPosition - 3, 25, yPosition + 20); // Left vertical line
    
    const vpText = safeString(evaluationResult.valueProposition);
    const vpLines = pdf.splitTextToSize(`"${vpText}"`, 165);
    pdf.text(vpLines, 30, yPosition);
    yPosition += vpLines.length * 6;
  }
  
  // Add page break
  pdf.addPage();
  return 20; // Start position for next section
}

/**
 * Process Audience section for PDF
 */
async function processAudienceSection(
  pdf: jsPDF,
  evaluationResult: any,
  yPosition: number
): Promise<number> {
  // Section title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 102, 204);
  pdf.text('Target Audience', 20, yPosition);
  yPosition += 10;
  
  // Demographics
  if (evaluationResult.targetAudience?.demographic) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Demographics', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const demoText = safeString(evaluationResult.targetAudience.demographic);
    const demoLines = pdf.splitTextToSize(demoText, 170);
    pdf.text(demoLines, 25, yPosition);
    yPosition += demoLines.length * 6;
  }
  
  yPosition += 5;
  
  // Psychographics
  if (evaluationResult.targetAudience?.psychographic) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Psychographics', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const psychoText = safeString(evaluationResult.targetAudience.psychographic);
    const psychoLines = pdf.splitTextToSize(psychoText, 170);
    pdf.text(psychoLines, 25, yPosition);
    yPosition += psychoLines.length * 6;
  }
  
  // Competitive Landscape
  if (evaluationResult.competitiveLandscape?.competitors) {
    yPosition += 10;
    
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Competitive Landscape', 20, yPosition);
    yPosition += 7;
    
    // Market Positioning if available
    if (evaluationResult.competitiveLandscape.marketPositioning) {
      pdf.setFontSize(12);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Market Positioning', 25, yPosition);
      yPosition += 5;
      
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      const posText = safeString(evaluationResult.competitiveLandscape.marketPositioning);
      const posLines = pdf.splitTextToSize(posText, 165);
      pdf.text(posLines, 30, yPosition);
      yPosition += posLines.length * 6 + 5;
    }
    
    // Differentiation Strategy if available
    if (evaluationResult.competitiveLandscape.differentiationStrategy) {
      pdf.setFontSize(12);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Differentiation Strategy', 25, yPosition);
      yPosition += 5;
      
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      const dsText = safeString(evaluationResult.competitiveLandscape.differentiationStrategy);
      const dsLines = pdf.splitTextToSize(dsText, 165);
      pdf.text(dsLines, 30, yPosition);
      yPosition += dsLines.length * 6 + 5;
    }
    
    // Competitors
    pdf.setFontSize(12);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Competitors', 25, yPosition);
    yPosition += 7;
    
    // Add each competitor with details
    for (const competitor of evaluationResult.competitiveLandscape.competitors) {
      // Check if we need a new page
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'bold');
      pdf.text(safeString(competitor.name), 30, yPosition);
      
      if (competitor.marketPosition) {
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        const nameText = safeString(competitor.name);
        const posText = safeString(competitor.marketPosition);
        pdf.text(`(${posText})`, 30 + pdf.getTextWidth(nameText) + 3, yPosition);
      }
      
      yPosition += 5;
      
      // Differentiation
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      const diffText = safeString(competitor.differentiation);
      const diffLines = pdf.splitTextToSize(diffText, 160);
      pdf.text(diffLines, 30, yPosition);
      yPosition += diffLines.length * 5 + 2;
      
      // Strengths and Weaknesses (if available)
      if (competitor.strengths || competitor.weaknesses) {
        // Two column layout
        const colWidth = 75;
        let colY = yPosition;
        
        // Strengths
        if (competitor.strengths && competitor.strengths.length > 0) {
          pdf.setFontSize(10);
          pdf.setTextColor(46, 125, 50); // Green
          pdf.setFont(undefined, 'bold');
          pdf.text('Strengths:', 30, colY);
          pdf.setFont(undefined, 'normal');
          colY += 5;
          
          for (const strength of competitor.strengths) {
            if (typeof strength === 'string') {
              const strengthLines = pdf.splitTextToSize(`• ${strength}`, colWidth);
              pdf.text(strengthLines, 30, colY);
              colY += strengthLines.length * 5;
            }
          }
        }
        
        // Reset Y for second column
        colY = yPosition;
        
        // Weaknesses
        if (competitor.weaknesses && competitor.weaknesses.length > 0) {
          pdf.setFontSize(10);
          pdf.setTextColor(211, 47, 47); // Red
          pdf.setFont(undefined, 'bold');
          pdf.text('Weaknesses:', 115, colY);
          pdf.setFont(undefined, 'normal');
          colY += 5;
          
          for (const weakness of competitor.weaknesses) {
            if (typeof weakness === 'string') {
              const weaknessLines = pdf.splitTextToSize(`• ${weakness}`, colWidth);
              pdf.text(weaknessLines, 115, colY);
              colY += weaknessLines.length * 5;
            }
          }
        }
        
        // Update yPosition to the maximum of the two columns
        yPosition = Math.max(colY, yPosition) + 5;
      }
      
      // Pricing strategy if available
      if (competitor.pricingStrategy) {
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'bold');
        pdf.text('Pricing Strategy:', 30, yPosition);
        pdf.setFont(undefined, 'normal');
        
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        const priceText = safeString(competitor.pricingStrategy);
        const priceLines = pdf.splitTextToSize(priceText, 160);
        pdf.text(priceLines, 30, yPosition + 5);
        yPosition += priceLines.length * 5 + 10;
      } else {
        yPosition += 5;
      }
      
      // Add divider except for last competitor
      if (evaluationResult.competitiveLandscape.competitors.indexOf(competitor) !== 
          evaluationResult.competitiveLandscape.competitors.length - 1) {
        pdf.setDrawColor(220, 220, 220);
        pdf.line(30, yPosition - 2, 180, yPosition - 2);
        yPosition += 7;
      }
    }
  }
  
  // Add page break
  pdf.addPage();
  return 20; // Start position for next section
}

/**
 * Process Technical section for PDF
 */
async function processTechnicalSection(
  pdf: jsPDF,
  evaluationResult: any,
  yPosition: number
): Promise<number> {
  // Section title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 102, 204);
  pdf.text('Technical Feasibility', 20, yPosition);
  yPosition += 10;
  
  if (evaluationResult.technicalFeasibility) {
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const techText = safeString(evaluationResult.technicalFeasibility);
    const techLines = pdf.splitTextToSize(techText, 170);
    pdf.text(techLines, 25, yPosition);
    yPosition += techLines.length * 6;
  }
  
  // Regulatory considerations
  if (evaluationResult.regulatoryConsiderations) {
    yPosition += 10;
    
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Regulatory Considerations', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const regText = safeString(evaluationResult.regulatoryConsiderations);
    const regLines = pdf.splitTextToSize(regText, 170);
    pdf.text(regLines, 25, yPosition);
    yPosition += regLines.length * 6;
  }
  
  // Add page break
  pdf.addPage();
  return 20; // Start position for next section
}

/**
 * Process Business section for PDF
 */
async function processBusinessSection(
  pdf: jsPDF,
  evaluationResult: any,
  yPosition: number
): Promise<number> {
  // Section title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 102, 204);
  pdf.text('Business Plan', 20, yPosition);
  yPosition += 10;
  
  // Revenue Model
  if (evaluationResult.businessPlan?.revenueModel) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Revenue Model', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const revenueText = safeString(evaluationResult.businessPlan.revenueModel);
    const revenueLines = pdf.splitTextToSize(revenueText, 170);
    pdf.text(revenueLines, 25, yPosition);
    yPosition += revenueLines.length * 6;
  }
  
  yPosition += 5;
  
  // Go To Market
  if (evaluationResult.businessPlan?.goToMarket) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Go-To-Market Strategy', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const gtmText = safeString(evaluationResult.businessPlan.goToMarket);
    const gtmLines = pdf.splitTextToSize(gtmText, 170);
    pdf.text(gtmLines, 25, yPosition);
    yPosition += gtmLines.length * 6;
  }
  
  yPosition += 5;
  
  // Milestones
  if (evaluationResult.businessPlan?.milestones && evaluationResult.businessPlan.milestones.length > 0) {
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
        yPosition += milestoneLines.length * 6;
        
        // Check if we need a new page
        if (yPosition > 270 && i < evaluationResult.businessPlan.milestones.length - 1) {
          pdf.addPage();
          yPosition = 20;
        }
      }
    }
  }
  
  // Add page break
  pdf.addPage();
  return 20; // Start position for next section
}

/**
 * Process Revenue section for PDF
 */
async function processRevenueSection(
  pdf: jsPDF,
  evaluationResult: any,
  yPosition: number
): Promise<number> {
  // Section title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 102, 204);
  pdf.text('Revenue Generation', 20, yPosition);
  yPosition += 10;
  
  // Business Models
  if (evaluationResult.revenueGeneration?.businessModels && evaluationResult.revenueGeneration.businessModels.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Business Models', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    
    for (const model of evaluationResult.revenueGeneration.businessModels) {
      if (typeof model === 'string') {
        const modelLines = pdf.splitTextToSize(`• ${model}`, 170);
        pdf.text(modelLines, 25, yPosition);
        yPosition += modelLines.length * 6;
      }
    }
  }
  
  yPosition += 5;
  
  // Pricing Strategy
  if (evaluationResult.revenueGeneration?.pricingStrategy) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Pricing Strategy', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const pricingText = safeString(evaluationResult.revenueGeneration.pricingStrategy);
    const pricingLines = pdf.splitTextToSize(pricingText, 170);
    pdf.text(pricingLines, 25, yPosition);
    yPosition += pricingLines.length * 6;
  }
  
  yPosition += 5;
  
  // Revenue Streams
  if (evaluationResult.revenueGeneration?.revenueStreams && evaluationResult.revenueGeneration.revenueStreams.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Revenue Streams', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    
    for (const stream of evaluationResult.revenueGeneration.revenueStreams) {
      if (typeof stream === 'string') {
        const streamLines = pdf.splitTextToSize(`• ${stream}`, 170);
        pdf.text(streamLines, 25, yPosition);
        yPosition += streamLines.length * 6;
      }
    }
  }
  
  yPosition += 5;
  
  // Unit Economics
  if (evaluationResult.revenueGeneration?.unitEconomics) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Unit Economics', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const economicsText = safeString(evaluationResult.revenueGeneration.unitEconomics);
    const economicsLines = pdf.splitTextToSize(economicsText, 170);
    pdf.text(economicsLines, 25, yPosition);
    yPosition += economicsLines.length * 6;
  }
  
  yPosition += 5;
  
  // Scaling Potential
  if (evaluationResult.revenueGeneration?.scalingPotential) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Scaling Potential', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const scalingText = safeString(evaluationResult.revenueGeneration.scalingPotential);
    const scalingLines = pdf.splitTextToSize(scalingText, 170);
    pdf.text(scalingLines, 25, yPosition);
    yPosition += scalingLines.length * 6;
  }
  
  // Add page break
  pdf.addPage();
  return 20; // Start position for next section
}

/**
 * Process Risks section for PDF
 */
async function processRisksSection(
  pdf: jsPDF,
  evaluationResult: any,
  yPosition: number
): Promise<number> {
  // Section title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 102, 204);
  pdf.text('Risk Assessment', 20, yPosition);
  yPosition += 10;
  
  // Fit Score Explanation
  if (evaluationResult.fitScoreExplanation) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Fit Score Explanation', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const scoreText = safeString(evaluationResult.fitScoreExplanation);
    const scoreLines = pdf.splitTextToSize(scoreText, 170);
    pdf.text(scoreLines, 25, yPosition);
    yPosition += scoreLines.length * 6;
  }
  
  yPosition += 5;
  
  // Risks
  if (evaluationResult.riskAssessment?.risks && evaluationResult.riskAssessment.risks.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Potential Risks', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    
    for (const risk of evaluationResult.riskAssessment.risks) {
      pdf.setTextColor(211, 47, 47); // Red for risk type
      pdf.setFont(undefined, 'bold');
      const riskType = safeString(risk.type);
      pdf.text(riskType, 25, yPosition);
      pdf.setFont(undefined, 'normal');
      yPosition += 6;
      
      pdf.setTextColor(60, 60, 60);
      const descText = safeString(risk.description);
      const descLines = pdf.splitTextToSize(descText, 165);
      pdf.text(descLines, 30, yPosition);
      yPosition += descLines.length * 6;
      
      pdf.setFont(undefined, 'bold');
      pdf.text('Mitigation:', 30, yPosition);
      pdf.setFont(undefined, 'normal');
      yPosition += 6;
      
      const mitigationText = safeString(risk.mitigation);
      const mitigationLines = pdf.splitTextToSize(mitigationText, 160);
      pdf.text(mitigationLines, 35, yPosition);
      yPosition += mitigationLines.length * 6 + 5;
      
      // Check if we need a new page
      if (yPosition > 270 && evaluationResult.riskAssessment.risks.indexOf(risk) !== evaluationResult.riskAssessment.risks.length - 1) {
        pdf.addPage();
        yPosition = 20;
      }
    }
  }
  
  // Add page break
  pdf.addPage();
  return 20; // Start position for next section
}

/**
 * Process Customers section for PDF
 */
async function processCustomersSection(
  pdf: jsPDF,
  evaluationResult: any,
  yPosition: number
): Promise<number> {
  // Section title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 102, 204);
  pdf.text('Customer Acquisition', 20, yPosition);
  yPosition += 10;
  
  // Primary Channels
  if (evaluationResult.customerAcquisition?.primaryChannels && evaluationResult.customerAcquisition.primaryChannels.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Primary Acquisition Channels', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    
    for (const channel of evaluationResult.customerAcquisition.primaryChannels) {
      if (typeof channel === 'string') {
        const channelLines = pdf.splitTextToSize(`• ${channel}`, 170);
        pdf.text(channelLines, 25, yPosition);
        yPosition += channelLines.length * 6;
      }
    }
  }
  
  yPosition += 5;
  
  // Acquisition Cost
  if (evaluationResult.customerAcquisition?.acquisitionCost) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Customer Acquisition Cost', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const costText = safeString(evaluationResult.customerAcquisition.acquisitionCost);
    const costLines = pdf.splitTextToSize(costText, 170);
    pdf.text(costLines, 25, yPosition);
    yPosition += costLines.length * 6;
  }
  
  yPosition += 5;
  
  // Conversion Strategy
  if (evaluationResult.customerAcquisition?.conversionStrategy) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Conversion Strategy', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const conversionText = safeString(evaluationResult.customerAcquisition.conversionStrategy);
    const conversionLines = pdf.splitTextToSize(conversionText, 170);
    pdf.text(conversionLines, 25, yPosition);
    yPosition += conversionLines.length * 6;
  }
  
  yPosition += 5;
  
  // Retention Tactics
  if (evaluationResult.customerAcquisition?.retentionTactics && evaluationResult.customerAcquisition.retentionTactics.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Retention Tactics', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    
    for (const tactic of evaluationResult.customerAcquisition.retentionTactics) {
      if (typeof tactic === 'string') {
        const tacticLines = pdf.splitTextToSize(`• ${tactic}`, 170);
        pdf.text(tacticLines, 25, yPosition);
        yPosition += tacticLines.length * 6;
      }
    }
  }
  
  yPosition += 5;
  
  // Growth Opportunities
  if (evaluationResult.customerAcquisition?.growthOpportunities) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Growth Opportunities', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const growthText = safeString(evaluationResult.customerAcquisition.growthOpportunities);
    const growthLines = pdf.splitTextToSize(growthText, 170);
    pdf.text(growthLines, 25, yPosition);
    yPosition += growthLines.length * 6;
  }
  
  // Add page break
  pdf.addPage();
  return 20; // Start position for next section
}

/**
 * Process Launch section for PDF
 */
async function processLaunchSection(
  pdf: jsPDF,
  evaluationResult: any,
  yPosition: number
): Promise<number> {
  // Section title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 102, 204);
  pdf.text('Launch Strategy', 20, yPosition);
  yPosition += 10;
  
  // MVP Features
  if (evaluationResult.launchStrategy?.mvpFeatures && evaluationResult.launchStrategy.mvpFeatures.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('MVP Features', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    
    for (let i = 0; i < evaluationResult.launchStrategy.mvpFeatures.length; i++) {
      const feature = evaluationResult.launchStrategy.mvpFeatures[i];
      if (typeof feature === 'string') {
        const featureLines = pdf.splitTextToSize(`${i + 1}. ${feature}`, 170);
        pdf.text(featureLines, 25, yPosition);
        yPosition += featureLines.length * 6;
      }
    }
  }
  
  yPosition += 5;
  
  // Time to Market
  if (evaluationResult.launchStrategy?.timeToMarket) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Time to Market', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const timeText = safeString(evaluationResult.launchStrategy.timeToMarket);
    const timeLines = pdf.splitTextToSize(timeText, 170);
    pdf.text(timeLines, 25, yPosition);
    yPosition += timeLines.length * 6;
  }
  
  yPosition += 5;
  
  // Market Entry Approach
  if (evaluationResult.launchStrategy?.marketEntryApproach) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Market Entry Approach', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const approachText = safeString(evaluationResult.launchStrategy.marketEntryApproach);
    const approachLines = pdf.splitTextToSize(approachText, 170);
    pdf.text(approachLines, 25, yPosition);
    yPosition += approachLines.length * 6;
  }
  
  yPosition += 5;
  
  // Critical Resources
  if (evaluationResult.launchStrategy?.criticalResources && evaluationResult.launchStrategy.criticalResources.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Critical Resources', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    
    for (const resource of evaluationResult.launchStrategy.criticalResources) {
      if (typeof resource === 'string') {
        const resourceLines = pdf.splitTextToSize(`• ${resource}`, 170);
        pdf.text(resourceLines, 25, yPosition);
        yPosition += resourceLines.length * 6;
      }
    }
  }
  
  yPosition += 5;
  
  // Launch Checklist
  if (evaluationResult.launchStrategy?.launchChecklist && evaluationResult.launchStrategy.launchChecklist.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Launch Checklist', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    
    for (let i = 0; i < evaluationResult.launchStrategy.launchChecklist.length; i++) {
      const item = evaluationResult.launchStrategy.launchChecklist[i];
      if (typeof item === 'string') {
        const itemLines = pdf.splitTextToSize(`☐ ${item}`, 170);
        pdf.text(itemLines, 25, yPosition);
        yPosition += itemLines.length * 6;
        
        // Check if we need a new page
        if (yPosition > 270 && i < evaluationResult.launchStrategy.launchChecklist.length - 1) {
          pdf.addPage();
          yPosition = 20;
        }
      }
    }
  }
  
  // Implementation Roadmap
  if (evaluationResult.implementationRoadmap?.phases && evaluationResult.implementationRoadmap.phases.length > 0) {
    yPosition += 10;
    
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Implementation Roadmap', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    
    for (const phase of evaluationResult.implementationRoadmap.phases) {
      // Check if we need a new page
      if (yPosition > 240) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(0, 102, 204);
      const timeframeText = safeString(phase.timeframe);
      pdf.text(`Phase: ${timeframeText}`, 25, yPosition);
      pdf.setFont(undefined, 'normal');
      yPosition += 7;
      
      // Tasks
      if (phase.tasks && phase.tasks.length > 0) {
        pdf.setTextColor(51, 51, 51);
        pdf.text('Tasks:', 30, yPosition);
        yPosition += 5;
        
        pdf.setTextColor(60, 60, 60);
        for (const task of phase.tasks) {
          if (typeof task === 'string') {
            const taskLines = pdf.splitTextToSize(`• ${task}`, 165);
            pdf.text(taskLines, 35, yPosition);
            yPosition += taskLines.length * 5 + 1;
          }
        }
      }
      
      yPosition += 3;
      
      // Success Metrics
      if (phase.metrics && phase.metrics.length > 0) {
        pdf.setTextColor(51, 51, 51);
        pdf.text('Success Metrics:', 30, yPosition);
        yPosition += 5;
        
        pdf.setTextColor(60, 60, 60);
        for (const metric of phase.metrics) {
          if (typeof metric === 'string') {
            const metricLines = pdf.splitTextToSize(`• ${metric}`, 165);
            pdf.text(metricLines, 35, yPosition);
            yPosition += metricLines.length * 5 + 1;
          }
        }
      }
      
      yPosition += 10;
    }
  }
  
  // Add page break
  pdf.addPage();
  return 20; // Start position for next section
}

/**
 * Process Bootstrapping section for PDF
 */
async function processBootstrappingSection(
  pdf: jsPDF,
  evaluationResult: any,
  yPosition: number
): Promise<number> {
  // Section title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 102, 204);
  pdf.text('Bootstrapping Guide', 20, yPosition);
  yPosition += 10;
  
  // Cost Minimization Tips
  if (evaluationResult.bootstrappingGuide?.costMinimizationTips && evaluationResult.bootstrappingGuide.costMinimizationTips.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Cost Minimization Tips', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    
    for (const tip of evaluationResult.bootstrappingGuide.costMinimizationTips) {
      if (typeof tip === 'string') {
        const tipLines = pdf.splitTextToSize(`• ${tip}`, 170);
        pdf.text(tipLines, 25, yPosition);
        yPosition += tipLines.length * 6;
      }
    }
  }
  
  yPosition += 5;
  
  // DIY Solutions
  if (evaluationResult.bootstrappingGuide?.diySolutions) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('DIY Solutions', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const diyText = safeString(evaluationResult.bootstrappingGuide.diySolutions);
    const diyLines = pdf.splitTextToSize(diyText, 170);
    pdf.text(diyLines, 25, yPosition);
    yPosition += diyLines.length * 6;
  }
  
  yPosition += 5;
  
  // Growth Without Funding
  if (evaluationResult.bootstrappingGuide?.growthWithoutFunding) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Growth Without Funding', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const growthText = safeString(evaluationResult.bootstrappingGuide.growthWithoutFunding);
    const growthLines = pdf.splitTextToSize(growthText, 170);
    pdf.text(growthLines, 25, yPosition);
    yPosition += growthLines.length * 6;
  }
  
  yPosition += 5;
  
  // Time Management
  if (evaluationResult.bootstrappingGuide?.timeManagement) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Time Management', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    const timeText = safeString(evaluationResult.bootstrappingGuide.timeManagement);
    const timeLines = pdf.splitTextToSize(timeText, 170);
    pdf.text(timeLines, 25, yPosition);
    yPosition += timeLines.length * 6;
  }
  
  yPosition += 5;
  
  // Milestones on Budget
  if (evaluationResult.bootstrappingGuide?.milestonesOnBudget && evaluationResult.bootstrappingGuide.milestonesOnBudget.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text('Achievable Milestones on Budget', 20, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    
    for (let i = 0; i < evaluationResult.bootstrappingGuide.milestonesOnBudget.length; i++) {
      const milestone = evaluationResult.bootstrappingGuide.milestonesOnBudget[i];
      if (typeof milestone === 'string') {
        const milestoneLines = pdf.splitTextToSize(`${i + 1}. ${milestone}`, 170);
        pdf.text(milestoneLines, 25, yPosition);
        yPosition += milestoneLines.length * 6;
      }
    }
  }
  
  // Add a final attribution and disclaimer
  yPosition += 15;
  
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Generated by Vibe Check - AI-powered business evaluation tool', 20, yPosition);
  yPosition += 5;
  pdf.text('This evaluation is for informational purposes only and should not replace professional business advice.', 20, yPosition);
  
  return yPosition;
}