import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTripSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Play } from "lucide-react";
import { z } from "zod";

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = insertTripSchema.extend({
  initialPassengers: z.number().min(0).max(100),
});

export function NewTripModal({ isOpen, onClose }: NewTripModalProps) {
  const { toast } = useToast();
  const { location } = useGeolocation();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: "",
      destination: "",
      initialPassengers: 0,
      currentLocation: null,
      driverName: "",
      driverContact: "",
      assistantName: "",
      assistantContact: "",
      revenue: "0",
    },
  });

  const createTripMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => 
      apiRequest('POST', '/api/trips', {
        ...data,
        currentLocation: location,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips/recent'] });
      toast({
        title: "Trip Started",
        description: "Your trip has been started successfully",
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start trip",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createTripMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Trip</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter origin location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter destination" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="initialPassengers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Passengers</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="driverName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter driver name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="driverContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter driver phone/email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="assistantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assistant Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter assistant name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="assistantContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assistant Contact (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter assistant phone/email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="revenue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Revenue</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white ripple-effect"
              disabled={createTripMutation.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              {createTripMutation.isPending ? "Starting..." : "Start Trip"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
