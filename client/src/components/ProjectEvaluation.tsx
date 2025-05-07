import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BarChart4, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet, 
  FolderCog, 
  Lightbulb, 
  PieChart, 
  ShieldAlert, 
  Store, 
  Target, 
  UserCircle,
  AlertCircle,
  Trash,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// Define a more comprehensive type for the project evaluation
interface ProjectEvaluationType {
  id: number;
  projectId: number;
  fitScore: number;
  createdAt: string;
  updatedAt: string;
  evaluation: {
    marketFitAnalysis: {
      strengths: string[];
      weaknesses: string[];
      demandPotential: string;
    };
    targetAudience: {
      demographic: string;
      psychographic: string;
    };
    fitScore: number;
    fitScoreExplanation: string;
    businessPlan: {
      revenueModel: string;
      goToMarketStrategy: string;
      keyMilestones: string[];
      resourcesNeeded: string[];
    };
    valueProposition: string;
    riskAssessment: {
      risks: {
        type: string;
        description: string;
        mitigation: string;
      }[];
    };
    technicalFeasibility: {
      stack: string;
      dependencies: string[];
      complexity: string;
    };
    regulatoryConsiderations: string[];
    partnershipOpportunities: string[];
    competitiveLandscape: {
      competitors: {
        name: string;
        description: string;
      }[];
      differentiationPoints: string[];
    };
  };
}

interface ProjectEvaluationProps {
  projectId: number;
  isUserOwner: boolean;
}

const ProjectEvaluation = ({ projectId, isUserOwner }: ProjectEvaluationProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    marketFit: true,
    targetAudience: false,
    businessPlan: false,
    valueProposition: true,
    riskAssessment: false,
    technicalFeasibility: false,
    regulatoryConsiderations: false,
    partnershipOpportunities: false,
    competitiveLandscape: false
  });

  // Fetch project evaluation using the public endpoint for debugging
  const { 
    data: evaluation, 
    isLoading, 
    isError,
    error, 
    refetch 
  } = useQuery<ProjectEvaluationType>({
    queryKey: [`/api/ai/public-evaluation/${projectId}`],
    enabled: !!projectId,
    // Don't refetch on window focus since evaluations don't change often
    refetchOnWindowFocus: false,
    // If error, don't retry automatically (likely a 404 which is expected if no evaluation exists)
    retry: false
  });

  // Data workaround for bypassing the HTML issue 
  const [manualData, setManualData] = useState<ProjectEvaluationType | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'error' | 'closed'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  
  // Use manual data if available
  const evaluationData = manualData || evaluation;
  
  // WebSocket setup
  useEffect(() => {
    // Create WebSocket connection to fetch evaluation data
    let ws: WebSocket | null = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);
    wsRef.current = ws;
    
    // Get user ID from sessionStorage
    let userId: string | null = null;
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      userId = user?.id?.toString();
    } catch (e) {
      console.error('Error getting user ID from session:', e);
    }
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      setWsStatus('connected');
      
      // Authenticate the websocket connection
      if (userId) {
        console.log('Authenticating WebSocket with user ID:', userId);
        ws.send(JSON.stringify({ 
          type: 'auth',
          userId: parseInt(userId)
        }));
      } else {
        console.error('No user ID available for WebSocket authentication');
        setWsStatus('error');
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        // Handle authentication success
        if (data.type === 'auth_success') {
          console.log('WebSocket authentication successful');
          
          // Request evaluation data after successful authentication
          if (projectId && userId) {
            console.log('Requesting evaluation data via WebSocket for project:', projectId);
            ws.send(JSON.stringify({
              type: 'fetch_evaluation',
              projectId,
              userId: parseInt(userId)
            }));
          }
        }
        
        // Handle evaluation data
        if (data.type === 'evaluation_data') {
          console.log('Received evaluation data via WebSocket:', data.evaluation);
          setManualData(data.evaluation);
        }
        
        // Handle evaluation error
        if (data.type === 'evaluation_error') {
          console.error('Evaluation error via WebSocket:', data.error);
          // Don't set error state here, we'll let the component handle the null state
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsStatus('error');
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setWsStatus('closed');
    };
    
    // Clean up WebSocket on unmount
    return () => {
      console.log('Closing WebSocket connection');
      if (ws) {
        ws.close();
      }
    };
  }, [projectId]);
  
  // Manually refetch evaluation via WebSocket
  const fetchViaWebSocket = () => {
    // Get user ID from sessionStorage
    let userId: string | null = null;
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      userId = user?.id?.toString();
    } catch (e) {
      console.error('Error getting user ID from session:', e);
    }
    
    if (!userId) {
      console.error('No user ID available for WebSocket evaluation request');
      return;
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('Sending evaluation request via WebSocket for project:', projectId);
      wsRef.current.send(JSON.stringify({
        type: 'fetch_evaluation',
        projectId,
        userId: parseInt(userId)
      }));
    } else {
      console.error('WebSocket not connected, cannot fetch evaluation');
    }
  };
  
  // Try to fetch data when component mounts
  useEffect(() => {
    if (projectId && wsStatus === 'connected') {
      console.log('Component mounted with active WebSocket, will fetch data via WS');
      fetchViaWebSocket();
    }
  }, [projectId, wsStatus]);

  // Generate evaluation mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting evaluation generation for project:', projectId);
      const response = await apiRequest("POST", "/api/ai/evaluate-project", { projectId });
      console.log('Evaluation generation API response:', response);
      
      // Try to fetch via WebSocket after generation
      setTimeout(fetchViaWebSocket, 1000);
      
      return response;
    },
    onSuccess: (data) => {
      console.log('Evaluation generated successfully:', data);
      toast({
        title: "Evaluation generated",
        description: "Your project evaluation has been successfully generated.",
      });
      // Invalidate the query to refetch with the new evaluation
      queryClient.invalidateQueries({ queryKey: [`/api/ai/public-evaluation/${projectId}`] });
      // Also invalidate the project query to show the evaluation in the project data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      
      // Force a refetch after a short delay to ensure the evaluation is loaded
      setTimeout(() => {
        console.log('Refetching evaluation after successful generation');
        fetchViaWebSocket(); // Use WebSocket fetch to get fresh data
        refetch();
      }, 1500);
    },
    onError: (error: any) => {
      console.error('Error generating evaluation:', error);
      toast({
        title: "Error generating evaluation",
        description: error?.message || "Failed to generate project evaluation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete evaluation mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/ai/project-evaluation/${projectId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Evaluation deleted",
        description: "Your project evaluation has been deleted.",
      });
      // Invalidate the queries
      queryClient.invalidateQueries({ queryKey: [`/api/ai/public-evaluation/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting evaluation",
        description: error?.message || "Failed to delete project evaluation. Please try again.",
        variant: "destructive",
      });
    }
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Define color based on fit score
  const getFitScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-lime-500";
    if (score >= 40) return "bg-yellow-500";
    if (score >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  // Handle generate evaluation button click
  const handleGenerateEvaluation = () => {
    console.log("Generating evaluation for project:", projectId);
    
    // Use the ApiRequest utility which properly handles authentication
    generateMutation.mutate();
    
    // Add a toast notification to let the user know the process has started
    toast({
      title: "Generating evaluation",
      description: "Your project evaluation is being generated. This may take a moment...",
    });
  };

  // Handle delete evaluation button click
  const handleDeleteEvaluation = () => {
    if (window.confirm("Are you sure you want to delete this evaluation? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  // If not owner, show message about evaluations being private
  if (!isUserOwner) {
    return (
      <div className="p-6 text-center">
        <Alert className="bg-gray-50 border-gray-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Private Feature</AlertTitle>
          <AlertDescription>
            Project evaluations are only visible to project owners.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (isLoading || generateMutation.isPending) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {generateMutation.isPending ? "Generating Evaluation" : "Loading Evaluation"}
        </h3>
        <p className="text-gray-500 max-w-md">
          {generateMutation.isPending
            ? "We're analyzing your project to provide comprehensive business insights. This may take a minute..."
            : "Loading your project evaluation data..."}
        </p>
      </div>
    );
  }

  // Error or no evaluation yet
  if ((isError || !evaluation) && !manualData) {
    console.log('Error or no evaluation:', { isError, error, evaluation });
    
    return (
      <div className="p-6">
        <div className="mb-6 text-center">
          <FileSpreadsheet className="h-12 w-12 text-primary mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">AI Project Evaluation</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Generate a comprehensive business analysis for your project including market fit, 
            audience profile, risk assessment, and more.
          </p>
          
          {isError && (
            <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              <p className="font-medium">Error loading evaluation:</p>
              <p>{(error as any)?.message || 'Unknown error occurred'}</p>
            </div>
          )}
          
          <Button 
            onClick={handleGenerateEvaluation}
            disabled={generateMutation.isPending}
            className="mx-auto"
          >
            {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Project Evaluation
          </Button>
        </div>
      </div>
    );
  }

  // Evaluation data exists, show the full evaluation
  console.log('Received evaluation data:', evaluationData);
  
  // Safety check in case evaluationData is null or undefined
  if (!evaluationData) {
    return (
      <div className="p-6 text-center">
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Data Error</AlertTitle>
          <AlertDescription>
            Unable to display evaluation data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const data = evaluationData.evaluation;
  console.log('Evaluation object data:', data);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold mb-1">AI Project Evaluation</h3>
          <p className="text-gray-500 text-sm">
            Generated on {new Date(evaluationData.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        {isUserOwner && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDeleteEvaluation}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash className="mr-2 h-4 w-4" />
            )}
            Delete Evaluation
          </Button>
        )}
      </div>
      
      {/* Fit Score Card */}
      <Card className="overflow-hidden border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-semibold flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-primary" />
              Market Fit Score
            </h4>
            <div className="flex items-center">
              <span className={`text-2xl font-bold ${
                evaluationData.fitScore < 40 ? "text-red-500" : 
                evaluationData.fitScore < 70 ? "text-yellow-500" : 
                "text-green-500"
              }`}>{evaluationData.fitScore}</span>
              <span className="text-gray-500 text-lg">/100</span>
            </div>
          </div>
          
          <Progress 
            value={evaluationData.fitScore} 
            className={`h-3 mb-2 [&>div]:${
              evaluationData.fitScore < 40 ? "bg-red-500" : 
              evaluationData.fitScore < 70 ? "bg-yellow-500" : 
              "bg-green-500"
            }`}
          />
          
          <p className="text-sm text-gray-600 mt-2">{data.fitScoreExplanation}</p>
        </div>
      </Card>
      
      {/* Market Fit Analysis */}
      <Card className="overflow-hidden border border-gray-200">
        <CardHeader 
          className="bg-gray-50 cursor-pointer px-6 py-4" 
          onClick={() => toggleSection('marketFit')}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <BarChart4 className="mr-2 h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Market Fit Analysis</CardTitle>
            </div>
            {expandedSections.marketFit ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
        
        {expandedSections.marketFit && (
          <CardContent className="px-6 py-4 space-y-4">
            <div>
              <h5 className="font-semibold mb-2 text-primary flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" /> Strengths
              </h5>
              <ul className="list-disc pl-5 space-y-1">
                {data.marketFitAnalysis.strengths.map((strength, index) => (
                  <li key={index} className="text-gray-700">{strength}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-2 text-orange-600 flex items-center">
                <ShieldAlert className="mr-2 h-4 w-4" /> Areas for Improvement
              </h5>
              <ul className="list-disc pl-5 space-y-1">
                {data.marketFitAnalysis.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-gray-700">{weakness}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-2 flex items-center">
                <Store className="mr-2 h-4 w-4" /> Market Demand Potential
              </h5>
              <p className="text-gray-700">{data.marketFitAnalysis.demandPotential}</p>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Value Proposition */}
      <Card className="overflow-hidden border border-gray-200">
        <CardHeader 
          className="bg-gray-50 cursor-pointer px-6 py-4" 
          onClick={() => toggleSection('valueProposition')}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg">Value Proposition</CardTitle>
            </div>
            {expandedSections.valueProposition ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
        
        {expandedSections.valueProposition && (
          <CardContent className="px-6 py-4">
            <div className="bg-amber-50 border border-amber-100 rounded-md p-4 text-amber-800 mb-1">
              <p className="italic font-medium">{data.valueProposition}</p>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Target Audience */}
      <Card className="overflow-hidden border border-gray-200">
        <CardHeader 
          className="bg-gray-50 cursor-pointer px-6 py-4" 
          onClick={() => toggleSection('targetAudience')}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <UserCircle className="mr-2 h-5 w-5 text-indigo-500" />
              <CardTitle className="text-lg">Target Audience</CardTitle>
            </div>
            {expandedSections.targetAudience ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
        
        {expandedSections.targetAudience && (
          <CardContent className="px-6 py-4 space-y-4">
            <div>
              <h5 className="font-semibold mb-2">Demographic Profile</h5>
              <p className="text-gray-700">{data.targetAudience.demographic}</p>
            </div>
            
            <div>
              <h5 className="font-semibold mb-2">Psychographic Profile</h5>
              <p className="text-gray-700">{data.targetAudience.psychographic}</p>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Business Plan */}
      <Card className="overflow-hidden border border-gray-200">
        <CardHeader 
          className="bg-gray-50 cursor-pointer px-6 py-4" 
          onClick={() => toggleSection('businessPlan')}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Target className="mr-2 h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Business Plan</CardTitle>
            </div>
            {expandedSections.businessPlan ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
        
        {expandedSections.businessPlan && (
          <CardContent className="px-6 py-4 space-y-4">
            <div>
              <h5 className="font-semibold mb-2">Revenue Model</h5>
              <p className="text-gray-700">{data.businessPlan.revenueModel}</p>
            </div>
            
            <div>
              <h5 className="font-semibold mb-2">Go-To-Market Strategy</h5>
              <p className="text-gray-700">{data.businessPlan.goToMarketStrategy}</p>
            </div>
            
            <div>
              <h5 className="font-semibold mb-2">Key Milestones</h5>
              <ul className="list-disc pl-5 space-y-1">
                {data.businessPlan.keyMilestones.map((milestone, index) => (
                  <li key={index} className="text-gray-700">{milestone}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-2">Resources Needed</h5>
              <div className="flex flex-wrap gap-2">
                {data.businessPlan.resourcesNeeded.map((resource, index) => (
                  <Badge key={index} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                    {resource}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Technical Feasibility */}
      <Card className="overflow-hidden border border-gray-200">
        <CardHeader 
          className="bg-gray-50 cursor-pointer px-6 py-4" 
          onClick={() => toggleSection('technicalFeasibility')}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FolderCog className="mr-2 h-5 w-5 text-gray-700" />
              <CardTitle className="text-lg">Technical Feasibility</CardTitle>
            </div>
            {expandedSections.technicalFeasibility ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
        
        {expandedSections.technicalFeasibility && (
          <CardContent className="px-6 py-4 space-y-4">
            <div>
              <h5 className="font-semibold mb-2">Tech Stack</h5>
              <p className="text-gray-700">{data.technicalFeasibility.stack}</p>
            </div>
            
            <div>
              <h5 className="font-semibold mb-2">Dependencies</h5>
              <div className="flex flex-wrap gap-2">
                {data.technicalFeasibility.dependencies.map((dependency, index) => (
                  <Badge key={index} variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    {dependency}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold mb-2">Complexity Level</h5>
              <Badge 
                variant="outline" 
                className={`
                  ${data.technicalFeasibility.complexity === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 
                    data.technicalFeasibility.complexity === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                    'bg-green-50 text-green-700 border-green-200'}
                `}
              >
                {data.technicalFeasibility.complexity} Complexity
              </Badge>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* More sections can be added as needed... */}
      
    </div>
  );
};

export default ProjectEvaluation;