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
import { Play, X, User } from "lucide-react";
import { z } from "zod";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { Driver } from "@shared/schema";

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
  const [newDropOffPoint, setNewDropOffPoint] = useState({
    name: '',
    coordinates: { lat: 0, lng: 0 },
    passengerCount: 0,
    farePerPassenger: 0,
    totalRevenue: 0
  });

  // Fetch active drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['/api/drivers/active'],
    queryFn: () => fetch('/api/drivers/active').then(res => res.json()) as Promise<Driver[]>,
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: "",
      destination: "",
      initialPassengers: 0,
      currentLocation: null,
      dropOffPoints: [],
      driverId: undefined,
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

  const addDropOffPoint = () => {
    if (newDropOffPoint.name && newDropOffPoint.farePerPassenger > 0) {
      const currentPoints = form.getValues('dropOffPoints') || [];
      form.setValue('dropOffPoints', [...currentPoints, {
        ...newDropOffPoint,
        coordinates: location || { lat: 0, lng: 0 }
      }]);
      setNewDropOffPoint({
        name: '',
        coordinates: { lat: 0, lng: 0 },
        passengerCount: 0,
        farePerPassenger: 0,
        totalRevenue: 0
      });
    }
  };

  const removeDropOffPoint = (index: number) => {
    const currentPoints = form.getValues('dropOffPoints') || [];
    form.setValue('dropOffPoints', currentPoints.filter((_, i) => i !== index));
  };

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
              name="driverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a driver" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{driver.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-3">
              <FormLabel>Drop-off Points</FormLabel>
              <div className="space-y-2">
                {form.watch('dropOffPoints')?.map((point, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium">{point.name}</span>
                      <span className="text-xs text-gray-500 ml-2">${point.farePerPassenger}/person</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDropOffPoint(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input 
                  placeholder="Drop-off location"
                  value={newDropOffPoint.name}
                  onChange={(e) => setNewDropOffPoint({...newDropOffPoint, name: e.target.value})}
                />
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="Fare"
                  value={newDropOffPoint.farePerPassenger || ''}
                  onChange={(e) => setNewDropOffPoint({...newDropOffPoint, farePerPassenger: parseFloat(e.target.value) || 0})}
                />
                <Button type="button" onClick={addDropOffPoint} size="sm">
                  Add
                </Button>
              </div>
            </div>
            
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
