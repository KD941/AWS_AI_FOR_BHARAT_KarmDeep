import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Building2 } from 'lucide-react';
import { vendorService } from '../../services/vendorService';
import { VendorProfile } from '../../types';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { VendorForm } from '../../components/vendors/VendorForm';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

export default function VendorsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorProfile | null>(null);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorService.listVendors({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<VendorProfile>) => vendorService.registerVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsCreateModalOpen(false);
      toast.success('Vendor created successfully');
    },
    onError: () => {
      toast.error('Failed to create vendor');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ vendorId, data }: { vendorId: string; data: Partial<VendorProfile> }) =>
      vendorService.updateVendor(vendorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setEditingVendor(null);
      toast.success('Vendor updated successfully');
    },
    onError: () => {
      toast.error('Failed to update vendor');
    },
  });

  const columns: ColumnDef<VendorProfile>[] = [
    {
      accessorKey: 'companyName',
      header: 'Company Name',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900">{row.original.companyName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'phoneNumber',
      header: 'Phone',
    },
    {
      accessorKey: 'address.city',
      header: 'Location',
      cell: ({ row }) => (
        <span>
          {row.original.address.city}, {row.original.address.country}
        </span>
      ),
    },
    {
      accessorKey: 'verificationStatus',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.original.verificationStatus === 'VERIFIED'
              ? 'bg-green-100 text-green-800'
              : row.original.verificationStatus === 'PENDING'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {row.original.verificationStatus}
        </span>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center space-x-1">
          <span className="text-yellow-500">★</span>
          <span>{row.original.rating.toFixed(1)}</span>
          <span className="text-gray-400 text-sm">({row.original.totalReviews})</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setEditingVendor(row.original)}
          className="text-primary-600 hover:text-primary-700"
          aria-label="Edit vendor"
        >
          <Edit className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="mt-2 text-gray-600">Manage vendor profiles and partnerships</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Vendor</span>
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading vendors...</p>
          </div>
        ) : (
          <DataTable
            data={data?.items || []}
            columns={columns}
            searchable={true}
            searchPlaceholder="Search vendors..."
          />
        )}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register Vendor"
        size="lg"
      >
        <VendorForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={!!editingVendor}
        onClose={() => setEditingVendor(null)}
        title="Edit Vendor"
        size="lg"
      >
        {editingVendor && (
          <VendorForm
            vendor={editingVendor}
            onSubmit={(data) =>
              updateMutation.mutate({
                vendorId: editingVendor.vendorId,
                data,
              })
            }
            onCancel={() => setEditingVendor(null)}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
