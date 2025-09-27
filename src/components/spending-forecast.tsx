
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/hooks/use-app';
import { forecastSpending, ForecastSpendingInput } from '@/ai/flows/spending-forecasting';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function SpendingForecast() {
  const { transactions } = useApp();
  const [forecast, setForecast] = useState<{ predictedLimit: string; alerts: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetForecast = async () => {
    if (transactions.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Not Enough Data',
        description: 'Log some expenses before getting a forecast.',
      });
      return;
    }

    setIsLoading(true);
    setForecast(null);

    try {
      const input: ForecastSpendingInput = {
        expensesData: JSON.stringify(transactions.map(t => ({ amount: t.amount, category: t.category, date: t.date }))),
        seasonalTrends: JSON.stringify({ "holidays": "none" }), // Placeholder for now
      };

      const result = await forecastSpending(input);
      setForecast(result);
    } catch (error) {
      console.error('Error fetching AI forecast:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch AI forecast. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary"/>
          AI Spending Forecast
        </CardTitle>
        <CardDescription>Get AI-powered predictions on your future spending habits and receive proactive alerts.</CardDescription>
      </CardHeader>
      <CardContent>
        {forecast && (
          <div className="space-y-4 mb-6">
            <Alert>
              <AlertTitle className="font-semibold">Predicted Spending Limit</AlertTitle>
              <AlertDescription>{forecast.predictedLimit}</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTitle className="font-semibold">Proactive Alerts</AlertTitle>
              <AlertDescription>{forecast.alerts}</AlertDescription>
            </Alert>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center my-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Analyzing your spending patterns...</p>
          </div>
        )}

        <Button onClick={handleGetForecast} disabled={isLoading} className="w-full">
          {isLoading ? 'Forecasting...' : 'Get AI Forecast'}
        </Button>
      </CardContent>
    </Card>
  );
}
