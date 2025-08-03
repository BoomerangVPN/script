// Vultr API v2 TypeScript Type Definitions

// Base API Response Types
export interface VultrApiResponse<T> {
  data: T;
  meta?: VultrMeta;
}

export interface VultrMeta {
  total?: number;
  links?: {
    next?: string;
    prev?: string;
  };
}

export interface VultrError {
  error: string;
  status: number;
}

// Authentication
export interface VultrAuthConfig {
  apiKey: string;
  baseUrl?: string;
}

// Instance Types
export interface VultrInstance {
  id: string;
  os: string;
  ram: number;
  disk: number;
  main_ip: string;
  vcpu_count: number;
  region: string;
  plan: string;
  date_created: string;
  status: 'active' | 'pending' | 'suspended' | 'resizing';
  allowed_bandwidth: number;
  netmask_v4: string;
  gateway_v4: string;
  power_status: 'running' | 'stopped';
  server_status: 'ok' | 'locked' | 'installingbooting' | 'isomounting';
  v6_network: string;
  v6_main_ip: string;
  v6_network_size: number;
  label: string;
  internal_ip: string;
  kvm: string;
  hostname: string;
  tag: string;
  os_id: number;
  app_id: number;
  image_id: string;
  firewall_group_id: string;
  features: string[];
  user_data: string;
  default_password?: string;
}

export interface CreateInstanceRequest {
  region: string;
  plan: string;
  os_id?: number;
  iso_id?: string;
  script_id?: string;
  snapshot_id?: string;
  enable_ipv6?: boolean;
  enable_private_network?: boolean;
  networks?: string[];
  label?: string;
  sshkey_id?: string[];
  backups?: 'enabled' | 'disabled';
  app_id?: number;
  image_id?: string;
  user_data?: string;
  ddos_protection?: boolean;
  activation_email?: boolean;
  hostname?: string;
  tag?: string;
  firewall_group_id?: string;
  reserved_ipv4?: string;
  enable_vpc?: boolean;
  enable_vpc2?: boolean;
  vpc_ids?: string[];
}

export interface UpdateInstanceRequest {
  plan?: string;
  tag?: string;
  label?: string;
  enable_ddos_protection?: boolean;
  enable_backups?: boolean;
  user_data?: string;
}

// Plans
export interface VultrPlan {
  id: string;
  vcpu_count: number;
  ram: number;
  disk: number;
  bandwidth: number;
  monthly_cost: number;
  type: 'vc2' | 'vhf' | 'vhp' | 'vcg';
  locations: string[];
  disk_count?: number;
  gpu_vram?: number;
  gpu_type?: string;
}

// Regions
export interface VultrRegion {
  id: string;
  city: string;
  country: string;
  continent: string;
  options: string[];
}

// Operating Systems
export interface VultrOS {
  id: number;
  name: string;
  arch: string;
  family: string;
}

// Applications
export interface VultrApplication {
  id: number;
  name: string;
  short_name: string;
  deploy_name: string;
  type: string;
  vendor: string;
  image_id: string;
}

// SSH Keys
export interface VultrSSHKey {
  id: string;
  name: string;
  ssh_key: string;
  date_created: string;
}

export interface CreateSSHKeyRequest {
  name: string;
  ssh_key: string;
}

// Snapshots
export interface VultrSnapshot {
  id: string;
  date_created: string;
  description: string;
  size: number;
  compressed_size: number;
  status: 'complete' | 'pending';
  os_id: number;
  app_id: number;
}

export interface CreateSnapshotRequest {
  instance_id: string;
  description?: string;
}

// Backups
export interface VultrBackup {
  id: string;
  date_created: string;
  description: string;
  size: number;
  status: 'complete' | 'pending';
}

// ISO Images
export interface VultrISO {
  id: string;
  filename: string;
  description: string;
  size: number;
  md5sum: string;
  sha512sum: string;
  date_created: string;
  status: 'complete' | 'pending';
}

// Private Networks
export interface VultrNetwork {
  id: string;
  region: string;
  description: string;
  v4_subnet: string;
  v4_subnet_mask: number;
  date_created: string;
}

export interface CreateNetworkRequest {
  region: string;
  description: string;
  v4_subnet?: string;
  v4_subnet_mask?: number;
}

// VPC (Virtual Private Cloud)
export interface VultrVPC {
  id: string;
  region: string;
  description: string;
  v4_subnet: string;
  v4_subnet_mask: number;
  date_created: string;
}

export interface CreateVPCRequest {
  region: string;
  description: string;
  v4_subnet?: string;
  v4_subnet_mask?: number;
}

// Firewall
export interface VultrFirewallGroup {
  id: string;
  description: string;
  date_created: string;
  date_modified: string;
  instance_count: number;
  rule_count: number;
  max_rule_count: number;
}

export interface VultrFirewallRule {
  id: number;
  type: 'v4' | 'v6';
  ip_type: string;
  action: 'accept' | 'drop';
  protocol: 'icmp' | 'tcp' | 'udp' | 'gre' | 'esp' | 'ah';
  port: string;
  source: string;
  notes?: string;
}

export interface CreateFirewallGroupRequest {
  description: string;
}

export interface CreateFirewallRuleRequest {
  ip_type: 'v4' | 'v6';
  protocol: 'icmp' | 'tcp' | 'udp' | 'gre' | 'esp' | 'ah';
  subnet: string;
  subnet_size: number;
  port?: string;
  notes?: string;
}

// Block Storage
export interface VultrBlockStorage {
  id: string;
  cost: number;
  status: 'active' | 'pending';
  size_gb: number;
  region: string;
  date_created: string;
  attached_to_instance?: string;
  label: string;
  mount_id: string;
}

export interface CreateBlockStorageRequest {
  region: string;
  size_gb: number;
  label?: string;
  block_type?: 'high_perf' | 'storage_opt';
}

// Reserved IPs
export interface VultrReservedIP {
  id: string;
  region: string;
  ip_type: 'v4' | 'v6';
  subnet: string;
  subnet_size: number;
  label: string;
  instance_id?: string;
}

export interface CreateReservedIPRequest {
  region: string;
  ip_type: 'v4' | 'v6';
  label?: string;
  instance_id?: string;
}

// Load Balancers
export interface VultrLoadBalancer {
  id: string;
  date_created: string;
  region: string;
  label: string;
  status: 'active' | 'pending';
  ipv4: string;
  ipv6: string;
  generic_info: {
    balancing_algorithm: string;
    ssl_redirect: boolean;
    sticky_sessions: {
      cookie_name: string;
    };
    proxy_protocol: boolean;
    private_network: string;
    health_check: {
      protocol: string;
      port: number;
      path: string;
      check_interval: number;
      response_timeout: number;
      unhealthy_threshold: number;
      healthy_threshold: number;
    };
  };
  has_ssl: boolean;
  attached_instances: string[];
  forwarding_rules: VultrForwardingRule[];
  firewall_rules: VultrFirewallRule[];
}

export interface VultrForwardingRule {
  rule_id: string;
  frontend_protocol: string;
  frontend_port: number;
  backend_protocol: string;
  backend_port: number;
}

// Databases
export interface VultrDatabase {
  id: string;
  date_created: string;
  plan: string;
  plan_disk: number;
  plan_ram: number;
  plan_vcpus: number;
  plan_replicas: number;
  region: string;
  database_engine: string;
  database_engine_version: string;
  vpc_id: string;
  status: 'active' | 'pending' | 'configuring';
  label: string;
  tag: string;
  dbname: string;
  ferretdb_credentials?: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
  host: string;
  port: number;
  username: string;
  password: string;
  maintenance_dow: string;
  maintenance_time: string;
  latest_backup: string;
  trusted_ips: string[];
  mysql_sql_modes: string[];
  mysql_require_primary_key: boolean;
  mysql_slow_query_log: boolean;
  mysql_long_query_time: number;
  redis_eviction_policy: string;
  cluster_time_zone: string;
  read_replicas: VultrDatabaseReplica[];
}

export interface VultrDatabaseReplica {
  id: string;
  date_created: string;
  plan: string;
  status: string;
  label: string;
  tag: string;
  region: string;
  host: string;
  port: number;
  username: string;
  password: string;
}

// Kubernetes
export interface VultrKubernetes {
  id: string;
  firewall_group_id: string;
  date_created: string;
  label: string;
  region: string;
  version: string;
  ha_controlplanes: boolean;
  enable_firewall: boolean;
  status: 'active' | 'pending' | 'error';
  ip: string;
  endpoint: string;
  cluster_subnet: string;
  service_subnet: string;
  node_pools: VultrKubernetesNodePool[];
}

export interface VultrKubernetesNodePool {
  id: string;
  date_created: string;
  date_updated: string;
  label: string;
  tag: string;
  plan: string;
  status: string;
  node_quantity: number;
  min_nodes: number;
  max_nodes: number;
  auto_scaler: boolean;
  nodes: VultrKubernetesNode[];
}

export interface VultrKubernetesNode {
  id: string;
  date_created: string;
  label: string;
  status: string;
}

// API Client Interface
export interface VultrAPIClient {
  // Instances
  listInstances(params?: {
    per_page?: number;
    cursor?: string;
  }): Promise<VultrApiResponse<VultrInstance[]>>;
  getInstance(instanceId: string): Promise<VultrApiResponse<VultrInstance>>;
  createInstance(
    data: CreateInstanceRequest
  ): Promise<VultrApiResponse<VultrInstance>>;
  updateInstance(
    instanceId: string,
    data: UpdateInstanceRequest
  ): Promise<void>;
  deleteInstance(instanceId: string): Promise<void>;
  startInstance(instanceId: string): Promise<void>;
  rebootInstance(instanceId: string): Promise<void>;
  reinstallInstance(
    instanceId: string,
    data?: { hostname?: string }
  ): Promise<VultrApiResponse<VultrInstance>>;

  // Plans
  listPlans(params?: { type?: string }): Promise<VultrApiResponse<VultrPlan[]>>;

  // Regions
  listRegions(): Promise<VultrApiResponse<VultrRegion[]>>;

  // Operating Systems
  listOS(): Promise<VultrApiResponse<VultrOS[]>>;

  // Applications
  listApplications(): Promise<VultrApiResponse<VultrApplication[]>>;

  // SSH Keys
  listSSHKeys(): Promise<VultrApiResponse<VultrSSHKey[]>>;
  createSSHKey(
    data: CreateSSHKeyRequest
  ): Promise<VultrApiResponse<VultrSSHKey>>;
  deleteSSHKey(keyId: string): Promise<void>;

  // Snapshots
  listSnapshots(): Promise<VultrApiResponse<VultrSnapshot[]>>;
  createSnapshot(
    data: CreateSnapshotRequest
  ): Promise<VultrApiResponse<VultrSnapshot>>;
  deleteSnapshot(snapshotId: string): Promise<void>;

  // Networks
  listNetworks(): Promise<VultrApiResponse<VultrNetwork[]>>;
  createNetwork(
    data: CreateNetworkRequest
  ): Promise<VultrApiResponse<VultrNetwork>>;
  deleteNetwork(networkId: string): Promise<void>;

  // VPC
  listVPCs(): Promise<VultrApiResponse<VultrVPC[]>>;
  createVPC(data: CreateVPCRequest): Promise<VultrApiResponse<VultrVPC>>;
  deleteVPC(vpcId: string): Promise<void>;

  // Firewall
  listFirewallGroups(): Promise<VultrApiResponse<VultrFirewallGroup[]>>;
  createFirewallGroup(
    data: CreateFirewallGroupRequest
  ): Promise<VultrApiResponse<VultrFirewallGroup>>;
  deleteFirewallGroup(groupId: string): Promise<void>;

  // Block Storage
  listBlockStorage(): Promise<VultrApiResponse<VultrBlockStorage[]>>;
  createBlockStorage(
    data: CreateBlockStorageRequest
  ): Promise<VultrApiResponse<VultrBlockStorage>>;
  deleteBlockStorage(blockId: string): Promise<void>;

  // Reserved IPs
  listReservedIPs(): Promise<VultrApiResponse<VultrReservedIP[]>>;
  createReservedIP(
    data: CreateReservedIPRequest
  ): Promise<VultrApiResponse<VultrReservedIP>>;
  deleteReservedIP(ipId: string): Promise<void>;
}
