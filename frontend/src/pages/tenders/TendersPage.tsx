import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, FileText, Calendar } from 'lucide-react';
import { tenderService } from '../../services/tenderService';
import { Tender } from '../../types';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { TenderForm } from '../../components/tenders/TenderForm';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

export default function TendersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['tenders', statusFilter],
    queryFn: () => tenderService.listTenders({ status: statusFilter || undefined, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Tender>) => tenderService.createTender(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      setIsCreateModalOpen(false);
      toast.success('Tender created successfully');
    },
    onError: () => {
      toast.error('Failed to create tender');
    },
  });

  const columns: ColumnDef<Tender>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: 'commercialTerms.budget',
      header: 'Budget',
      cell: ({ row }) => (
        <span>
          {row.original.commercialTerms.currency} {row.original.commercialTerms.budget.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'deadline',
      header: 'Deadline',
      cell: ({ row }) => (
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{format(new Date(row.original.deadline), 'MMM dd, yyyy')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.original.status === 'PUBLISHED'
              ? 'bg-green-100 text-green-800'
              : row.original.status === 'DRAFT'
              ? 'bg-gray-100 text-gray-800'
              : row.original.status === 'AWARDED'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM dd, yyyy'),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setEditingTender(row.original)}
          className="text-primary-600 hover:text-primary-700"
          aria-label="Edit tender"
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
          <h1 className="text-3xl font-bold text-gray-900">Tenders</h1>
          <p className="mt-2 text-gray-600">Manage tenders and bidding process</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Tender</span>
        </button>
      </div>

      <div className="card">
        <div className="mb-6">
          <label htmlFor="status-filter" className="label">Filter by Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-48"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CLOSED">Closed</option>
            <option value="AWARDED">Awarded</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading tenders...</p>
          </div>
        ) : (
          <DataTable
            data={data?.items || []}
            columns={columns}
            searchable={true}
            searchPlaceholder="Search tenders..."
          />
        )}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Tender"
        size="lg"
      >
        <TenderForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={!!editingTender}
        onClose={() => setEditingTender(null)}
        title="Edit Tender"
        size="lg"
      >
        {editingTender && (
          <TenderForm
            tender={editingTender}
            onSubmit={(_data) => {
              // Note: Update API not implemented in backend yet
              toast.info('Tender update not yet implemented');
              setEditingTender(null);
            }}
            onCancel={() => setEditingTender(null)}
            isLoading={false}
          />
        )}
      </Modal>
    </div>
  );
}
