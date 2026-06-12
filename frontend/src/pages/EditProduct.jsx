import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCloudUploadAlt, 
  faShoppingBag, 
  faTag, 
  faAlignLeft, 
  faDollarSign, 
  faBoxes, 
  faCheckCircle, 
  faTimesCircle,
  faArrowLeft,
  faTrashAlt,
  faExclamationTriangle,
  faPlus,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import { getProductById, updateProduct, deleteProduct, getProductImages, deleteProductImage, setProductPrimaryImage } from '../api/product';
import { getCategories } from '../api/category';
import { useAuth } from '../context/AuthContext';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Data State
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]); // Array of File objects
  const [newPreviews, setNewPreviews] = useState([]); // Array of base64 strings

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    category_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productRes, categoriesRes, imagesRes] = await Promise.all([
          getProductById(id),
          getCategories(),
          getProductImages(id)
        ]);

        const prod = productRes.data;
        
        // Verificar dueño
        if (user && prod.seller_id !== user.id) {
          navigate('/shop');
          return;
        }

        setFormData({
          title: prod.title,
          description: prod.description,
          price: prod.price.toString(),
          stock: prod.stock.toString(),
          category_id: prod.category_id
        });
        
        setExistingImages(imagesRes.data || []);
        setCategories(categoriesRes.data || []);
      } catch (err) {
        setError('Error al cargar los datos del producto.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (existingImages.length + newImages.length + files.length > 5) {
      setError('Máximo 5 imágenes permitidas en total.');
      return;
    }

    const updatedNewImages = [...newImages];
    const updatedNewPreviews = [...newPreviews];

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" es demasiado grande (Máximo 5MB)`);
      } else {
        updatedNewImages.push(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          updatedNewPreviews.push(reader.result);
          setNewPreviews([...updatedNewPreviews]);
        };
        reader.readAsDataURL(file);
      }
    });

    setNewImages(updatedNewImages);
    setError(null);
  };

  const removePendingImage = (index) => {
    const updated = [...newImages];
    const updatedPrevs = [...newPreviews];
    updated.splice(index, 1);
    updatedPrevs.splice(index, 1);
    setNewImages(updated);
    setNewPreviews(updatedPrevs);
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (existingImages.length === 1 && newImages.length === 0) {
      setError('El producto debe tener al menos una imagen.');
      return;
    }

    try {
      setSaving(true);
      await deleteProductImage(id, imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      setError(null);
    } catch (err) {
      setError('Error al eliminar la imagen.');
    } finally {
      setSaving(false);
    }
  };
  const handleSetPrimary = async (imageId) => {
    try {
      setSaving(true);
      await setProductPrimaryImage(id, imageId);
      
      // Actualizar estado local (solo una puede ser principal)
      setExistingImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })));
      
      setError(null);
    } catch (err) {
      setError('Error al cambiar la imagen principal.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimaryPending = (index) => {
    setError('Debes guardar el producto primero para que las nuevas imágenes puedan ser principales.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      setSaving(true);
      
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('stock', formData.stock);
      data.append('category_id', formData.category_id);
      
      if (newImages.length > 0) {
        newImages.forEach(img => {
          data.append('images', img);
        });
      }

      await updateProduct(id, data);
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/product/${id}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error al actualizar el producto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      await deleteProduct(id);
      navigate('/shop');
    } catch (err) {
      setError('Error al eliminar el producto.');
      setShowDeleteModal(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light/20 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-brand-primary font-bold transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Descartar Cambios
          </button>
          <div className="text-right">
            <h1 className="text-3xl font-display font-black text-brand-secondary">Editar Producto</h1>
            <p className="text-gray-500 text-sm font-medium">Actualiza los detalles de tu publicación.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Left Side */}
          <div className="lg:col-span-7">
            <motion.form 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit}
              className="glass-card p-8 space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-secondary flex items-center gap-2">
                  <FontAwesomeIcon icon={faTag} className="text-brand-primary text-xs" />
                  Título del Producto
                </label>
                <input 
                  type="text" 
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-brand-primary focus:outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-secondary flex items-center gap-2">
                    <FontAwesomeIcon icon={faDollarSign} className="text-brand-primary text-xs" />
                    Precio (USD)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-brand-primary focus:outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-secondary flex items-center gap-2">
                    <FontAwesomeIcon icon={faBoxes} className="text-brand-primary text-xs" />
                    Stock
                  </label>
                  <input 
                    type="number" 
                    name="stock"
                    required
                    min="1"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-brand-primary focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-secondary flex items-center gap-2">
                  <FontAwesomeIcon icon={faShoppingBag} className="text-brand-primary text-xs" />
                  Categoría
                </label>
                <select 
                  name="category_id"
                  required
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-brand-primary focus:outline-none transition-all font-medium appearance-none bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-secondary flex items-center gap-2">
                  <FontAwesomeIcon icon={faAlignLeft} className="text-brand-primary text-xs" />
                  Descripción
                </label>
                <textarea 
                  name="description"
                  required
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-brand-primary focus:outline-none transition-all font-medium resize-none"
                ></textarea>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100"
                  >
                    <FontAwesomeIcon icon={faTimesCircle} />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-3 p-4 bg-green-50 text-green-600 rounded-xl text-sm font-bold border border-green-100"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    ¡Producto actualizado correctamente!
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-4">
                <button 
                  type="submit"
                  disabled={saving || success}
                  className={`flex-grow py-5 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg ${
                    saving || success 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-brand-primary text-brand-secondary hover:shadow-xl'
                  }`}
                >
                  {saving ? (
                    <div className="w-6 h-6 border-4 border-brand-secondary/30 border-t-brand-secondary rounded-full animate-spin"></div>
                  ) : 'Guardar Cambios'}
                </button>
                
                <button 
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-50 text-red-600 border-2 border-red-100 px-6 py-5 rounded-[1.5rem] font-bold hover:bg-red-100 transition-colors"
                >
                  <FontAwesomeIcon icon={faTrashAlt} />
                </button>
              </div>
            </motion.form>
          </div>

          {/* Right Side: Image Gallery */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 h-fit"
            >
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary">Galería de Imágenes</h3>
                <span className="text-[10px] font-black text-brand-secondary bg-brand-light px-2 py-1 rounded-full">
                  {existingImages.length + newImages.length}/5
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Existing Images */}
                {existingImages.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-brand-primary/10 shadow-sm">
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    
                    {/* Botones de acción */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button"
                        onClick={() => handleDeleteExistingImage(img.id)}
                        className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        title="Eliminar imagen"
                      >
                        <FontAwesomeIcon icon={faTrashAlt} size="xs" />
                      </button>
                      
                      {!img.is_primary && (
                        <button 
                          type="button"
                          onClick={() => handleSetPrimary(img.id)}
                          className="w-8 h-8 bg-white text-amber-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          title="Poner como principal"
                        >
                          <FontAwesomeIcon icon={faStar} size="xs" />
                        </button>
                      )}
                    </div>

                    {img.is_primary && (
                      <div className="absolute top-2 left-2 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg">
                        <FontAwesomeIcon icon={faStar} size="xs" />
                      </div>
                    )}

                    {img.is_primary && (
                      <div className="absolute bottom-0 inset-x-0 bg-brand-primary/90 text-brand-secondary text-[10px] font-black py-1 text-center uppercase">
                        Principal
                      </div>
                    )}
                  </div>
                ))}

                {/* New Image Previews */}
                {newPreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-brand-primary shadow-md scale-95">
                    <img src={preview} alt="" className="w-full h-full object-cover opacity-70" />
                    <button 
                      type="button"
                      onClick={() => removePendingImage(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg"
                    >
                      <FontAwesomeIcon icon={faTimesCircle} size="xs" />
                    </button>
                    <div className="absolute top-2 left-2 bg-brand-primary text-brand-secondary text-[8px] font-black px-2 py-1 rounded-full uppercase">
                      Nuevo
                    </div>
                  </div>
                ))}

                {/* Add Button */}
                {existingImages.length + newImages.length < 5 && (
                  <button 
                    type="button"
                    onClick={() => document.getElementById('image-upload').click()}
                    className="aspect-square rounded-2xl border-4 border-dashed border-gray-100 hover:border-brand-primary/30 hover:bg-brand-light/20 transition-all flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-brand-secondary group"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-2xl group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Añadir</span>
                  </button>
                )}
              </div>

              <input 
                id="image-upload"
                type="file" 
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              
              <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase text-center">
                JPG, PNG o WEBP. Máximo 5MB por foto.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-brand-secondary/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl space-y-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-brand-secondary">¿Eliminar Producto?</h2>
                <p className="text-gray-500 font-medium">
                  Esta acción es permanente y no se puede deshacer. Tu producto desaparecerá inmediatamente del marketplace.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDelete}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors"
                >
                  Sí, eliminar para siempre
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-4 bg-gray-100 text-brand-secondary font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                >
                  No, mantener producto
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditProduct;
