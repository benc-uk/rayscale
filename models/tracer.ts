export class Tracer {
  // API endpoint and acts as unique key, as no tracer on the network can have the same endpoint
  // E.g. http://tracer-pod0:8500/api 
  endPoint: string;     

  // GUID, not currently used
  id: string;
}