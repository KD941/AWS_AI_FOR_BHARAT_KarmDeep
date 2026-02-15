import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product } from '../../types';
import { FileUpload } from '../ui/FileUpload';
import { useState } from 'react';

const productSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  specifications: z.record(z.any()),
  pricing: z.object({
    basePrice: z.number().min(0, 'Price must be positive'),
    currency: z.string(),
    negotiable: z.boolean(),
  }),
  availability: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'PRE_ORDER']),
  certifications: z.array(z.string()),
  warranty: z.object({
    duration: z.number().min(0),
    unit: z.enum(['MONTHS', 'YEARS']),
    terms: z.string(),
  }),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: Partial<Product>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      pricing: {
        currency: 'USD',
        negotiable: false,
      },
      availability: 'IN_STOCK',
      warranty: {
        duration: 12,
        unit: 'MONTHS',
        terms: 'Standard warranty',
      },
      certifications: [],
      specifications: {},
    },
  });

  const onFormSubmit = (data: ProductFormData) => {
    onSubmit({
      ...data,
      images: files.map((f) => URL.createObjectURL(f)), // In production, upload to S3 first
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Product Name *</label>
          <input {...register('productName')} className="input" />
          {errors.productName && (
            <p className="text-sm text-red-600 mt-1">{errors.productName.message}</p>
          )}
        </div>

        <div>
          <label className="label">Category *</label>
          <select {...register('category')} className="input">
            <option value="">Select category</option>
            <option value="CNC Machines">CNC Machines</option>
            <option value="VMC">VMC</option>
            <option value="3D Printers">3D Printers</option>
            <option value="Automation">Automation</option>
          </select>
          {errors.category && (
            <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label className="label">Subcategory</label>
          <input {...register('subcategory')} className="input" />
        </div>

        <div>
          <label className="label">Base Price *</label>
          <input
            type="number"
            {...register('pricing.basePrice', { valueAsNumber: true })}
            className="input"
          />
          {errors.pricing?.basePrice && (
            <p className="text-sm text-red-600 mt-1">{errors.pricing.basePrice.message}</p>
          )}
        </div>

        <div>
          <label className="label">Currency</label>
          <select {...register('pricing.currency')} className="input">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="INR">INR</option>
          </select>
        </div>

        <div>
          <label className="label">Availability *</label>
          <select {...register('availability')} className="input">
            <option value="IN_STOCK">In Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="PRE_ORDER">Pre-Order</option>
          </select>
        </div>

        <div>
          <label className="label">Warranty Duration *</label>
          <input
            type="number"
            {...register('warranty.duration', { valueAsNumber: true })}
            className="input"
          />
        </div>

        <div>
          <label className="label">Warranty Unit</label>
          <select {...register('warranty.unit')} className="input">
            <option value="MONTHS">Months</option>
            <option value="YEARS">Years</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="label">Warranty Terms</label>
          <textarea {...register('warranty.terms')} className="input" rows={3} />
        </div>

        <div className="col-span-2">
          <label className="flex items-center space-x-2">
            <input type="checkbox" {...register('pricing.negotiable')} className="rounded" />
            <span className="text-sm text-gray-700">Price is negotiable</span>
          </label>
        </div>

        <div className="col-span-2">
          <label className="label">Product Images</label>
          <FileUpload
            onFilesSelected={(newFiles) => setFiles([...files, ...newFiles])}
            files={files}
            onRemove={(index) => setFiles(files.filter((_, i) => i !== index))}
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
            maxFiles={5}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn btn-primary">
          {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
