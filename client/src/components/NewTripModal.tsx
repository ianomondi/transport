import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTripSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Play, X, User, MapPin, Route } from "lucide-react";
import { z } from "zod";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { Driver } from "@shared/schema";

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = insertTripSchema;

export function NewTripModal({ isOpen, onClose }: NewTripModalProps) {
  const { toast } = useToast();
  const { location } = useGeolocation();
  const [selectedOrigin, setSelectedOrigin] = useState<string>("");

  // Fetch available locations
  const { data: locations = [] } = useQuery({
    queryKey: ['/api/routes/locations'],
    queryFn: () => fetch('/api/routes/locations').then(res => res.json()) as Promise<string[]>,
  });

  // Fetch available destinations based on origin
  const { data: destinations = [] } = useQuery({
    queryKey: ['/api/routes/destinations', selectedOrigin],
    queryFn: () => fetch(`/api/routes/destinations/${selectedOrigin}`).then(res => res.json()) as Promise<string[]>,
    enabled: !!selectedOrigin,
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
      currentLocation: null,
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
        description: "Your trip has been started with automatic drop-off points",
      });
      form.reset();
      setSelectedOrigin("");
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
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    From
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedOrigin(value);
                      form.setValue('destination', ''); // Reset destination when origin changes
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select origin location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    To
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedOrigin}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedOrigin ? "Select destination" : "Select origin first"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {destinations.map((destination) => (
                        <SelectItem key={destination} value={destination}>
                          {destination}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            
            <div className="rounded-lg border p-3 bg-blue-50/50 border-blue-200">
              <div className="flex items-center gap-2 text-blue-800 text-sm">
                <Route className="h-4 w-4" />
                <span className="font-medium">Drop-off points will be automatically mapped based on your selected route</span>
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
