import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
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
  faStore,
  faTrashAlt,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { createProduct } from '../api/product';
import { getCategories } from '../api/category';

const Sell = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '1',
    category_id: ''
  });
  
  const [images, setImages] = useState([]); // Array of File objects
  const [previews, setPreviews] = useState([]); // Array of base64 strings

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      setError('Máximo 5 imágenes permitidas.');
      return;
    }

    const newImages = [...images];
    const newPreviews = [...previews];

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" es demasiado grande (Máximo 5MB)`);
      } else {
        newImages.push(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          setPreviews([...newPreviews]);
        };
        reader.readAsDataURL(file);
      }
    });

    setImages(newImages);
    setError(null);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    const newPreviews = [...previews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (images.length === 0) {
      setError('Por favor selecciona al menos una imagen para tu producto.');
      return;
    }

    try {
      setLoading(true);
      
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', Number(formData.price));
      data.append('stock', parseInt(formData.stock, 10));
      data.append('category_id', formData.category_id);
      
      // Append all images
      images.forEach(img => {
        data.append('images', img);
      });

      await createProduct(data);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/shop');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error al publicar el producto. Revisa los campos.');
    } finally {
      setLoading(false);
    }
  };

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
            Volver
          </button>
          <div className="text-right">
            <h1 className="text-3xl font-display font-black text-brand-secondary">Publicar Producto</h1>
            <p className="text-gray-500 text-sm font-medium">Llega a miles de compradores en Tungurahua.</p>
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
                  placeholder="Ej: Pan de Pinllo Artesanal"
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
                    placeholder="0.00"
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
                  <option value="">Selecciona una categoría</option>
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
                  placeholder="Describe los detalles, materiales o sabor de tu producto..."
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
                    ¡Producto publicado con éxito! Redirigiendo...
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={loading || success}
                className={`w-full py-5 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg ${
                  loading || success 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-brand-primary text-brand-secondary hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-brand-secondary/30 border-t-brand-secondary rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCloudUploadAlt} />
                    Publicar Ahora
                  </>
                )}
              </button>
            </motion.form>
          </div>

          {/* Right Side: Image Gallery & Help */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 h-fit"
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary">Galería de Imágenes</h3>
                <span className="text-[10px] font-black text-brand-secondary bg-brand-light px-2 py-1 rounded-full">{images.length}/5</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {previews.map((preview, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={index} 
                    className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-brand-primary/10 shadow-sm"
                  >
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.preventDefault(); removeImage(index); }}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <FontAwesomeIcon icon={faTrashAlt} size="xs" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-0 inset-x-0 bg-brand-primary/90 text-brand-secondary text-[10px] font-black py-1 text-center uppercase">
                        Principal
                      </div>
                    )}
                  </motion.div>
                ))}

                {images.length < 5 && (
                  <button 
                    onClick={(e) => { e.preventDefault(); document.getElementById('image-upload').click(); }}
                    className="aspect-square rounded-2xl border-4 border-dashed border-gray-100 hover:border-brand-primary/30 hover:bg-brand-light/20 transition-all flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-brand-secondary group"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-2xl group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Añadir</span>
                  </button>
                )}
              </div>

              {images.length === 0 && (
                <div 
                  onClick={() => document.getElementById('image-upload').click()}
                  className="mt-4 aspect-[4/3] rounded-2xl border-4 border-dashed border-gray-100 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-brand-primary/30 transition-all"
                >
                  <FontAwesomeIcon icon={faCloudUploadAlt} className="text-4xl text-gray-200 mb-2" />
                  <p className="text-xs font-bold text-gray-400">Sube fotos de alta calidad para vender más rápido</p>
                </div>
              )}

              <input 
                id="image-upload"
                type="file" 
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </motion.div>

            {/* Seller Tips */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-brand-secondary p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group"
            >
              <div className="relative z-10 space-y-4">
                <h4 className="text-xl font-bold">Consejos de Oro 💡</h4>
                <ul className="text-sm space-y-3 font-medium opacity-90">
                  <li className="flex gap-3">
                    <span className="text-brand-primary">•</span> Un buen título atrae 3 veces más clientes.
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand-primary">•</span> Todas las fotos del mismo tamaño lucen mejor.
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand-primary">•</span> Describe qué hace especial a tu producto.
                  </li>
                </ul>
              </div>
              <FontAwesomeIcon 
                icon={faStore} 
                className="absolute -right-8 -bottom-8 text-white/5 text-9xl transform -rotate-12 group-hover:scale-110 transition-transform duration-700" 
              />
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Sell;
