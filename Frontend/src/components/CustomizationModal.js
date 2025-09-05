import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CustomizationModal.css';

const CustomizationModal = ({ isOpen, onClose, product, onAddToCart }) => {
  const { user } = useAuth();
  const [customization, setCustomization] = useState({
    specialData: '',
    names: '',
    description: '',
    event: '',
    customEvent: '',
    zodiacSign: '',
    // Resin-specific
    resinDate1: '',
    resinDate2: '',
    resinName1: '',
    resinName2: '',
    resinEvent: '',
    resinEventDate: '',
    resinEventOther: '',
    // Frames-specific
    frameName1: '',
    frameName2: '',
    frameDate1: '',
    frameDate2: '',
    frameEvent: '',
    frameEventOther: '',
    frameEventDate: '',
    frameSetType: '',
    // Custom frame type dynamic fields (UI only)
    customNames: [], // array of strings
    customNotes: []  // array of { date: '', currency: '' }
  });
  const [frameVariant, setFrameVariant] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen) {
      setCustomization({
        specialData: '',
        names: '',
        description: '',
        event: '',
        customEvent: '',
        zodiacSign: '',
        resinDate1: '',
        resinDate2: '',
        resinName1: '',
        resinName2: '',
        resinEvent: '',
        resinEventDate: '',
        resinEventOther: '',
        frameName1: '',
        frameName2: '',
        frameDate1: '',
        frameDate2: '',
        frameEvent: '',
        frameEventOther: '',
        frameEventDate: '',
        frameSetType: '',
        customNames: [],
        customNotes: []
      });
      setImageFiles([]);
      setImagePreviews([]);
      // Initialize default frame variant based on selected product
      const idOrName = ((product?.id || '') + ' ' + (product?.name || '')).toLowerCase();
      const isCustom = idOrName.includes('custom');
      if (isCustom) {
        setFrameVariant('custom');
      } else {
        const isSmall = idOrName.includes('small');
        const idRaw = (product?.id || '').toLowerCase();
        const explicitVariant = (idRaw.includes('1-200set') || idRaw.includes('1-500set') || idRaw.includes('small1') || idRaw.includes('small2') || idRaw.includes('big2'))
          ? product.id
          : null;
        setFrameVariant(explicitVariant || (isSmall ? 'small1_1note_1name' : 'big1_1-200set_2notes_2names'));
      }
    }
  }, [isOpen, product]);

  const handleInputChange = (field, value) => {
    setCustomization(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Custom frame handlers
  const addCustomName = () => {
    setCustomization(prev => ({ ...prev, customNames: [...(prev.customNames || []), ''] }));
  };
  const updateCustomName = (idx, value) => {
    setCustomization(prev => {
      const arr = [...(prev.customNames || [])];
      arr[idx] = value;
      return { ...prev, customNames: arr };
    });
  };
  const removeCustomName = (idx) => {
    setCustomization(prev => {
      const arr = [...(prev.customNames || [])];
      arr.splice(idx, 1);
      return { ...prev, customNames: arr };
    });
  };
  const addCustomNote = () => {
    setCustomization(prev => ({ ...prev, customNotes: [...(prev.customNotes || []), { date: '', currency: '' }] }));
  };
  const updateCustomNote = (idx, field, value) => {
    setCustomization(prev => {
      const arr = [...(prev.customNotes || [])];
      arr[idx] = { ...(arr[idx] || { date: '', currency: '' }), [field]: value };
      return { ...prev, customNotes: arr };
    });
  };
  const removeCustomNote = (idx) => {
    setCustomization(prev => {
      const arr = [...(prev.customNotes || [])];
      arr.splice(idx, 1);
      return { ...prev, customNotes: arr };
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      // Enforce image limits
      const productType = product?.category?.toLowerCase() || product?.type?.toLowerCase() || '';
      let limited = files;
      if (productType.includes('resin')) {
        // Resin: small -> 1 photo, large -> up to 4 photos
        const isSmall = (product?.id || '').toLowerCase().includes('small') || (product?.name || '').toLowerCase().includes('small');
        const maxPhotos = isSmall ? 1 : 4;
        limited = files.slice(0, maxPhotos);
      } else if (productType.includes('frame')) {
        // Frames: allow up to 10 photos
        const maxPhotos = 10;
        limited = files.slice(0, maxPhotos);
      }

      setImageFiles(limited);
      // Create previews
      Promise.all(
        limited.map(
          (file) =>
            new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(file);
            })
        )
      ).then((previews) => setImagePreviews(previews));
    } else {
      setImageFiles([]);
      setImagePreviews([]);
    }
  };

  const removeImage = (indexToRemove) => {
    const newImageFiles = imageFiles.filter((_, index) => index !== indexToRemove);
    const newImagePreviews = imagePreviews.filter((_, index) => index !== indexToRemove);
    setImageFiles(newImageFiles);
    setImagePreviews(newImagePreviews);
  };

  const clearAllImages = () => {
    setImageFiles([]);
    setImagePreviews([]);
    // Reset the file input values by targeting them more specifically
    const fileInputs = document.querySelectorAll('#resinImages, #frameImages, #customImage');
    fileInputs.forEach(input => {
      if (input) {
        input.value = '';
      }
    });
  };

  // const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'; // unused
  // let imageUrl = null; // unused

  const uploadImages = async () => {
    if (!imageFiles || imageFiles.length === 0) return [];
    setImageUploading(true);
    try {
      const formData = new FormData();
      imageFiles.forEach((f) => formData.append('images', f));
      // Add structured upload helpers
      if (user?.email) formData.append('userId', user.email);
      if (user?.name) formData.append('userName', user.name);
      if (product?.name) formData.append('namePrefix', product.name);

      // Add timeout/abort to avoid indefinite hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(new Error('Upload timed out after 20s')), 20000);
      const response = await api.post('/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = response.data;
      setImageUploading(false);
      if (data.success && Array.isArray(data.images)) {
        const urls = data.images.map((x) => x.imageUrl).filter(Boolean);
        const names = data.images.map((x) => x.originalName || '').filter(Boolean);
        const folder = data.images[0]?.folder || '';
        return { urls, names, folder };
      }
      console.error('Upload failed:', data.message || data);
      return { urls: [], names: [] };
    } catch (error) {
      console.error('Image upload error:', error);
      setImageUploading(false);
      return { urls: [], names: [] };
    }
  };

  const calcNameExtraCost = (name) => {
    if (!name) return 0;
    const letters = Math.min(50, (name || '').replace(/\s+/g, '').length);
    if (letters === 0) return 0;
    if (letters <= 10) return letters * 45; // ≤10 letters: ₹45 per letter
    return letters * 40; // >10 letters: ₹40 per letter from the first letter
  };

  // Price per currency denomination for custom notes in frames
  const getNotePrice = (denom) => {
    const map = {
      '1': 499,
      '5': 599,
      '10': 399,
      '20': 699,
      '50': 1299,
      '100': 1499,
      '200': 1599,
      '500': 2499
    };
    return map[String(denom)] || 0;
  };

  // Extract set label like "1-200" or "1-500" from variant string
  const getSetFromVariant = (variantStr) => {
    const v = String(variantStr || '');
    const m = v.match(/(\d+-\d+)set/i);
    if (m && m[1]) return m[1];
    // Fallback based on presence of 500 vs 200 in the key
    if (v.includes('500')) return '1-500';
    if (v.includes('200')) return '1-200';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      console.log('[Customization] submit:start', { productName: product?.name, productId: product?.id });
      // let imageUrl = null; // unused
      const productType = product.category?.toLowerCase() || product.type?.toLowerCase() || '';
      const isFrameOrResin = productType.includes('frame') || productType.includes('resin');
      const isFrame = productType.includes('frame') && !productType.includes('resin');
      const isCurrencyNote = productType.includes('currency') || productType.includes('note');
      const isZodiac = productType.includes('zodiac') || productType.includes('coin') || productType.includes('stamp');

      // Resin validation: make name(s) and at least one photo required
      if (productType.includes('resin')) {
        const isSmall = (product?.id || '').toLowerCase().includes('small') || (product?.name || '').toLowerCase().includes('small');
        const missing = [];
        if (isSmall) {
          if (!customization.resinName1?.trim()) missing.push('Name');
          // Require Event and Event Date for small resin
          if (!customization.resinEvent) missing.push('Event');
          if (customization.resinEvent === 'Other' && !customization.resinEventOther?.trim()) missing.push('Event (Other)');
          if (!customization.resinEventDate) missing.push('Event Date');
        } else {
          if (!customization.resinName1?.trim()) missing.push('Person 1 Name');
          if (!customization.resinDate1) missing.push('Person 1 Date');
          if (!customization.resinName2?.trim()) missing.push('Person 2 Name');
          if (!customization.resinDate2) missing.push('Person 2 Date');
          // Require Event and Event Date for large resin as well
          if (!customization.resinEvent) missing.push('Event');
          if (customization.resinEvent === 'Other' && !customization.resinEventOther?.trim()) missing.push('Event (Other)');
          if (!customization.resinEventDate) missing.push('Event Date');
        }
        if (!imageFiles || imageFiles.length === 0) missing.push('Photo');
        if (missing.length > 0) {
          console.log('[Customization] validation:failed', { missing });
          alert(`Please provide: ${missing.join(', ')}`);
          setIsSubmitting(false);
          return;
        }
    }

      let imageUrls = [];
      let imageNames = [];
      let folder = '';
      if (isFrameOrResin && imageFiles.length > 0) {
        console.log('[Customization] upload:start', { count: imageFiles.length });
        const res = await uploadImages();
        console.log('[Customization] upload:done', { urls: (res && res.urls ? res.urls.length : 0) });
        imageUrls = res.urls || [];
        imageNames = res.names || [];
        folder = res.folder || '';
      }

    const customizationData = { ...customization };
    if (imageUrls.length > 0) {
      customizationData.imageUrls = imageUrls;
      if (imageNames.length > 0) customizationData.imageNames = imageNames;
      if (folder) customizationData.folder = folder;
    }

    if (isCurrencyNote) {
      const eventValue = customization.event === 'Other' ? customization.customEvent : customization.event;
      customizationData.description = eventValue;
    }
    if (isZodiac) {
      customizationData.description = customization.zodiacSign || customization.description || '';
    }
    
    // Frames-specific aggregation & validation
    if (isFrame) {
      const isSmall = (product?.id || '').toLowerCase().includes('small') || (product?.name || '').toLowerCase().includes('small');
      const sizeText = isSmall ? '8x15 inches' : '13x19 inches';
      const idRaw = (product?.id || '').toLowerCase();
      const variant = frameVariant
        || ((idRaw.includes('1-200set') || idRaw.includes('1-500set') || idRaw.includes('small1') || idRaw.includes('small2') || idRaw.includes('big2')) ? product.id : (isSmall ? 'small1_1note_1name' : 'big1_1-200set_2notes_2names'));

      // Validation
      const missing = [];
      if (!imageFiles || imageFiles.length === 0) missing.push('At least 1 Photo');
      if (variant.startsWith('small1')) {
        if (!customization.frameName1?.trim()) missing.push('Name');
        if (!customization.frameEvent) missing.push('Event');
        if (customization.frameEvent === 'Other' && !customization.frameEventOther?.trim()) missing.push('Event (Other)');
        if (!customization.frameEventDate) missing.push('Event Date');
      } else if (variant.startsWith('small2')) {
        if (!customization.frameName1?.trim()) missing.push('Name 1');
        if (!customization.frameDate1) missing.push('Date 1');
        if (!customization.frameName2?.trim()) missing.push('Name 2');
        if (!customization.frameDate2) missing.push('Date 2');
        if (!customization.frameEvent) missing.push('Event');
        if (customization.frameEvent === 'Other' && !customization.frameEventOther?.trim()) missing.push('Event (Other)');
      } else if (variant.startsWith('big1')) {
        if (!customization.frameEvent) missing.push('Event');
        if (customization.frameEvent === 'Other' && !customization.frameEventOther?.trim()) missing.push('Event (Other)');
        if (!customization.frameEventDate) missing.push('Event Date');
        if (!customization.frameName1?.trim()) missing.push('Name 1');
        if (!customization.frameDate1) missing.push('Date 1');
        if (!customization.frameName2?.trim()) missing.push('Name 2');
        if (!customization.frameDate2) missing.push('Date 2');
      } else if (variant.startsWith('big2')) {
        if (!customization.frameEvent) missing.push('Event');
        if (customization.frameEvent === 'Other' && !customization.frameEventOther?.trim()) missing.push('Event (Other)');
        if (!customization.frameEventDate) missing.push('Event Date');
        if (!customization.frameName1?.trim()) missing.push('Name 1');
        if (!customization.frameDate1) missing.push('Date 1');
        if (!customization.frameName2?.trim()) missing.push('Name 2');
        if (!customization.frameDate2) missing.push('Date 2');
      } else if (variant === 'custom') {
        // Custom: require at least 3 Notes with both Date and Currency
        const validNotes = (customization.customNotes || []).filter(n => (n?.date && n?.currency));
        if (validNotes.length < 3) missing.push('At least 3 Notes (with Date and Currency)');
      }
      if (missing.length > 0) {
        alert(`Please provide: ${missing.join(', ')}`);
        return;
      }

      const basePrice = Number(product.price) || 0;

      if (variant === 'custom') {
        // Compute extras from all custom names and notes (denomination-based)
        const namesArr = customization.customNames || [];
        const nameItems = namesArr.map((nm, i) => {
          const letters = Math.min(50, (nm || '').replace(/\s+/g, '').length);
          const cost = calcNameExtraCost(nm);
          return { label: `Name ${i + 1}`, letters, cost };
        });
        const noteItems = (customization.customNotes || [])
          .map((n, i) => {
            const denom = n?.currency || '';
            const cost = denom ? getNotePrice(denom) : 0;
            return denom ? { label: `Note ${i + 1} (${denom})`, denomination: denom, cost } : null;
          })
          .filter(Boolean);
        const totalExtras = [...nameItems, ...noteItems].reduce((s, x) => s + x.cost, 0);

        // Build customization payload for custom
        const finalEvent = customization.frameEvent === 'Other' ? customization.frameEventOther : customization.frameEvent;
        customizationData.description = `${isSmall ? 'Small Frame' : 'Large Frame'} ${sizeText} • Custom`;
        customizationData.event = finalEvent || '';
        customizationData.customEvent = customization.frameEvent === 'Other' ? (customization.frameEventOther || '') : '';
        if (customization.frameEventDate) customizationData.frameEventDate = customization.frameEventDate;
        customizationData.customNames = namesArr;
        customizationData.customNotes = (customization.customNotes || []).map(n => ({ date: n?.date || '', currency: n?.currency || '' }));

        customizationData.priceBreakdown = {
          base: basePrice,
          extras: [...nameItems, ...noteItems],
          totalExtras
        };

        const finalProduct = { ...product, price: basePrice + totalExtras };
        console.log('[Customization] addToCart:custom:start');
        onAddToCart(finalProduct, 1, customizationData);
        console.log('[Customization] addToCart:custom:done');
        onClose();
        return;
      } else {
        // Compute extras using same name pricing logic for predefined variants
        const letters1 = Math.min(50, (customization.frameName1 || '').replace(/\s+/g, '').length);
        const letters2 = Math.min(50, (customization.frameName2 || '').replace(/\s+/g, '').length);
        const name1Cost = customization.frameName1 ? calcNameExtraCost(customization.frameName1) : 0;
        const name2Cost = customization.frameName2 ? calcNameExtraCost(customization.frameName2) : 0;
        const totalExtras = (variant.includes('2names') ? (name1Cost + name2Cost) : name1Cost);

        // Build customization payload
        const finalEvent = customization.frameEvent === 'Other' ? customization.frameEventOther : customization.frameEvent;
        const setLabel = getSetFromVariant(variant);
        customizationData.description = `${isSmall ? 'Small Frame' : 'Large Frame'} ${sizeText}${(!isSmall && setLabel) ? ` • Set: ${setLabel}` : ''}`;
        customizationData.specialData = variant.startsWith('small1') ? (customization.frameEventDate || '') : '';
        customizationData.event = finalEvent || '';
        customizationData.customEvent = customization.frameEvent === 'Other' ? (customization.frameEventOther || '') : '';
        if (customization.frameName1) customizationData.frameName1 = customization.frameName1;
        if (customization.frameName2) customizationData.frameName2 = customization.frameName2;
        if (customization.frameDate1) customizationData.frameDate1 = customization.frameDate1;
        if (customization.frameDate2) customizationData.frameDate2 = customization.frameDate2;
        if (customization.frameEventDate) customizationData.frameEventDate = customization.frameEventDate;
        if (!isSmall) customizationData.frameSetType = setLabel || '';

        customizationData.priceBreakdown = {
          base: basePrice,
          extras: [
            ...(customization.frameName1 ? [{ label: 'Name 1', letters: letters1, cost: name1Cost }] : []),
            ...(customization.frameName2 ? [{ label: 'Name 2', letters: letters2, cost: name2Cost }] : [])
          ],
          totalExtras: totalExtras
        };

        // Adjust price and add to cart
        const finalProduct = { ...product, price: basePrice + totalExtras };
        console.log('[Customization] addToCart:frame:start');
        onAddToCart(finalProduct, 1, customizationData);
        console.log('[Customization] addToCart:frame:done');
        onClose();
        return;
      }
    }

    // Resin-specific aggregation: dates, names, pricing and description
    if (productType.includes('resin')) {
      const isSmall = (product?.id || '').toLowerCase().includes('small') || (product?.name || '').toLowerCase().includes('small');
      const sizeText = isSmall ? '8x15 inches' : '13x19 inches';

      // Compute extra costs
      let extraCost = 0;
      const basePrice = Number(product.price) || 0;
      if (isSmall) {
        const letters1 = Math.min(50, (customization.resinName1 || '').replace(/\s+/g, '').length);
        const name1Cost = calcNameExtraCost(customization.resinName1);
        extraCost += name1Cost;
        // For small: keep fields separate to avoid duplication
        customizationData.names = customization.resinName1 || '';
        customizationData.specialData = customization.resinEventDate || '';
        const finalResinEvent = customization.resinEvent === 'Other' ? customization.resinEventOther : customization.resinEvent;
        customizationData.resinEvent = finalResinEvent || '';
        customizationData.resinEventDate = customization.resinEventDate || '';
        customizationData.description = `Small Resin ${sizeText}`;
        customizationData.priceBreakdown = {
          base: basePrice,
          extras: [
            { label: 'Name 1', letters: letters1, cost: name1Cost }
          ],
          totalExtras: name1Cost
        };
      } else {
        const letters1 = Math.min(50, (customization.resinName1 || '').replace(/\s+/g, '').length);
        const letters2 = Math.min(50, (customization.resinName2 || '').replace(/\s+/g, '').length);
        const name1Cost = calcNameExtraCost(customization.resinName1);
        const name2Cost = calcNameExtraCost(customization.resinName2);
        extraCost += name1Cost + name2Cost;
        // For large: combine Name + Date per person in description only (avoid duplicates)
        customizationData.names = '';
        customizationData.specialData = '';
        const p1 = `${customization.resinName1 || 'N/A'} (${customization.resinDate1 || 'N/A'})`;
        const p2 = `${customization.resinName2 || 'N/A'} (${customization.resinDate2 || 'N/A'})`;
        customizationData.description = `Large Resin ${sizeText} | Person 1: ${p1} | Person 2: ${p2}`;
        customizationData.resinEventDate = customization.resinEventDate || '';
        const finalResinEvent = customization.resinEvent === 'Other' ? customization.resinEventOther : customization.resinEvent;
        customizationData.resinEvent = finalResinEvent || '';
        customizationData.priceBreakdown = {
          base: basePrice,
          extras: [
            { label: 'Name 1', letters: letters1, cost: name1Cost },
            { label: 'Name 2', letters: letters2, cost: name2Cost }
          ],
          totalExtras: name1Cost + name2Cost
        };
      }

      // Adjust product price with extra cost
      const finalProduct = { ...product, price: basePrice + extraCost };
      console.log('[Customization] addToCart:resin:start');
      onAddToCart(finalProduct, 1, customizationData);
      console.log('[Customization] addToCart:resin:done');
      onClose();
      return;
    }
    
    console.log('[Customization] addToCart:default:start');
    onAddToCart(product, 1, customizationData);
    console.log('[Customization] addToCart:default:done');
    onClose();
    } finally {
      console.log('[Customization] submit:finally:setIsSubmitting(false)');
      setIsSubmitting(false);
    }
  };

  const getPlaceholderText = (field) => {
    if (!product) return '';

    const productType = product.category?.toLowerCase() || product.type?.toLowerCase() || '';

    switch (field) {
      case 'specialData':
        if (productType.includes('currency') || productType.includes('note')) {
          return 'e.g., Anniversary (12/05/2020), Birthday (15/08/1995)';
        }
        if (productType.includes('zodiac') || productType.includes('coin')) {
          return 'e.g., Leo, Virgo, Scorpio';
        }
        return 'Special date or occasion';

      case 'description':
        if (productType.includes('frame') || productType.includes('resin')) {
          return 'e.g., Wedding special with bride and groom, 25th Anniversary gift, Birthday surprise for mom';
        }
        if (productType.includes('currency') || productType.includes('note')) {
          return 'e.g., Gift for dad\'s retirement, Lucky number for business, Special memory from our wedding day';
        }
        return 'Additional details or description';

      default:
        return '';
    }
  };

  const getFieldLabel = (field) => {
    if (!product) return '';

    const productType = product.category?.toLowerCase() || product.type?.toLowerCase() || '';

    switch (field) {
      case 'specialData':
        if (productType.includes('currency') || productType.includes('note')) {
          return 'Special Date *';
        }
        return 'Special Information';

      case 'names':
        if (productType.includes('frame') || productType.includes('resin')) {
          return 'Names';
        }
        return 'Names';

      case 'description':
        return 'Description';

      default:
        return '';
    }
  };

  const shouldShowField = (field) => {
    if (!product) return false;

    const productType = product.category?.toLowerCase() || product.type?.toLowerCase() || '';

    switch (field) {
      case 'specialData':
        return productType.includes('currency') || productType.includes('note');
      
      case 'names':
        return false; // Remove names field completely
      
      case 'description':
        // Hide generic description for frames and resin; show for currency/note only
        return productType.includes('currency') || productType.includes('note');
      
      default:
        return false;
    }
  };

  // Check if this is a frame or resin product to show image upload
  const shouldShowImageUpload = () => {
    if (!product) return false;
    const productType = product.category?.toLowerCase() || product.type?.toLowerCase() || '';
    return productType.includes('frame') || productType.includes('resin');
  };

  if (!isOpen || !product) return null;

  return (
    <div className="customization-modal-overlay" onClick={onClose}>
      <div className="customization-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Order Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="product-info">
            <h3>{product.name}</h3>
            <p className="product-price">₹{product.price}</p>
          </div>

          <form onSubmit={handleSubmit} className="customization-form">
            {(() => {
              const productType = product.category?.toLowerCase() || product.type?.toLowerCase() || '';
              const isResin = productType.includes('resin');
              if (!isResin) return null;
              const isSmall = (product?.id || '').toLowerCase().includes('small') || (product?.name || '').toLowerCase().includes('small');
              const sizeText = isSmall ? '8x15 inches' : '13x19 inches';
              const maxPhotos = isSmall ? 1 : 4;
              const extraCostSmall = calcNameExtraCost(customization.resinName1);
              const extraCostLarge = calcNameExtraCost(customization.resinName1) + calcNameExtraCost(customization.resinName2);
              const extraCost = isSmall ? extraCostSmall : extraCostLarge;
              const finalPrice = Number(product.price) + extraCost;
              return (
                <div className="resin-section">
                  {/* Resin size info */}
                  <div className="form-group">
                    <div className="form-static">Size: {sizeText}</div>
                  </div>

                  {/* Resin fields: Name, Event and Event Date */}
                  {isSmall ? (
                    <>
                      <div className="form-group">
                        <label htmlFor="resinName1">Name *</label>
                        <input
                          type="text"
                          id="resinName1"
                          value={customization.resinName1}
                          onChange={(e) => handleInputChange('resinName1', e.target.value)}
                          className="form-input"
                          maxLength={50}
                          required
                        />
                        <small className="helper-text">
                          • Up to 10 letters: ₹45 per letter<br/>
                          • More than 10 letters: ₹40 per letter (50 letters max)
                        </small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="resinEvent">Event *</label>
                        <select
                          id="resinEvent"
                          value={customization.resinEvent}
                          onChange={(e) => handleInputChange('resinEvent', e.target.value)}
                          className="form-input"
                          required
                        >
                          <option value="">-- Select an Event --</option>
                          <option value="Anniversary">Anniversary</option>
                          <option value="Wedding">Wedding</option>
                          <option value="Birthday">Birthday</option>
                          <option value="House Warming Ceremony">House Warming Ceremony</option>
                          <option value="Retirement">Retirement</option>
                          <option value="Other">Other</option>
                        </select>
                        {customization.resinEvent === 'Other' && (
                          <input
                            type="text"
                            value={customization.resinEventOther}
                            onChange={(e) => handleInputChange('resinEventOther', e.target.value)}
                            placeholder="Please specify the event"
                            className="form-input"
                            style={{ marginTop: '10px' }}
                            required
                          />
                        )}
                        <small className="helper-text">Required: choose an occasion for this resin.</small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="resinEventDate">Event Date *</label>
                        <input
                          type="date"
                          id="resinEventDate"
                          value={customization.resinEventDate}
                          onChange={(e) => handleInputChange('resinEventDate', e.target.value)}
                          className="form-input"
                          required
                        />
                        <small className="helper-text">Required: event date for this resin.</small>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label htmlFor="resinName1">Person 1 Name *</label>
                        <input
                          type="text"
                          id="resinName1"
                          value={customization.resinName1}
                          onChange={(e) => handleInputChange('resinName1', e.target.value)}
                          className="form-input"
                          maxLength={50}
                          required
                        />
                        <small className="helper-text">
                          • Up to 10 letters: ₹45 per letter<br/>
                          • More than 10 letters: ₹40 per letter (50 letters max)
                        </small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="resinDate1">Date 1 *</label>
                        <input
                          type="date"
                          id="resinDate1"
                          value={customization.resinDate1}
                          onChange={(e) => handleInputChange('resinDate1', e.target.value)}
                          className="form-input"
                          required
                        />
                        <small className="helper-text">Enter date for: {customization.resinName1 || 'Person 1'}</small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="resinName2">Person 2 Name *</label>
                        <input
                          type="text"
                          id="resinName2"
                          value={customization.resinName2}
                          onChange={(e) => handleInputChange('resinName2', e.target.value)}
                          className="form-input"
                          maxLength={50}
                          required
                        />
                        <small className="helper-text">
                          • Up to 10 letters: ₹45 per letter<br/>
                          • More than 10 letters: ₹40 per letter (50 letters max)
                        </small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="resinDate2">Date 2 *</label>
                        <input
                          type="date"
                          id="resinDate2"
                          value={customization.resinDate2}
                          onChange={(e) => handleInputChange('resinDate2', e.target.value)}
                          className="form-input"
                          required
                        />
                        <small className="helper-text">Enter date for: {customization.resinName2 || 'Person 2'}</small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="resinEvent">Event *</label>
                        <select
                          id="resinEvent"
                          value={customization.resinEvent}
                          onChange={(e) => handleInputChange('resinEvent', e.target.value)}
                          className="form-input"
                          required
                        >
                          <option value="">-- Select an Event --</option>
                          <option value="Anniversary">Anniversary</option>
                          <option value="Wedding">Wedding</option>
                          <option value="Birthday">Birthday</option>
                          <option value="House Warming Ceremony">House Warming Ceremony</option>
                          <option value="Retirement">Retirement</option>
                          <option value="Other">Other</option>
                        </select>
                        {customization.resinEvent === 'Other' && (
                          <input
                            type="text"
                            value={customization.resinEventOther}
                            onChange={(e) => handleInputChange('resinEventOther', e.target.value)}
                            placeholder="Please specify the event"
                            className="form-input"
                            style={{ marginTop: '10px' }}
                            required
                          />
                        )}
                        <small className="helper-text">Required: choose an occasion for this resin.</small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="resinEventDate">Event Date *</label>
                        <input
                          type="date"
                          id="resinEventDate"
                          value={customization.resinEventDate}
                          onChange={(e) => handleInputChange('resinEventDate', e.target.value)}
                          className="form-input"
                          required
                        />
                        <small className="helper-text">Required: a special event date for the resin.</small>
                      </div>
                    </>
                  )}
                  {/* Resin image upload (single image) */}
                  <div className="form-group">
                    <label htmlFor="resinImages">Upload Photo{maxPhotos > 1 ? 's' : ''} {maxPhotos > 1 ? `(up to ${maxPhotos})` : '(only 1)'}</label>
                    <input
                      type="file"
                      id="resinImages"
                      onChange={handleImageChange}
                      accept="image/*"
                      multiple={maxPhotos > 1}
                      required
                      className="form-input"
                    />
                    {imagePreviews && imagePreviews.length > 0 && (
                      <div className="image-preview-container">
                        <div className="image-preview-header">
                          <span className="image-counter">Selected Images ({imagePreviews.length})</span>
                          <button 
                            type="button" 
                            onClick={clearAllImages}
                            className="clear-all-btn"
                            title="Clear all images"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="image-preview" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                          {imagePreviews.map((src, idx) => (
                            <div key={idx} className="image-preview-item">
                              <img 
                                src={src} 
                                alt={`Preview ${idx+1}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="remove-image-btn"
                                title="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <div className="form-static">
                      <div><strong>Price Breakdown</strong></div>
                      <div>Base Price: ₹{Number(product.price)}</div>
                      {extraCost > 0 && (
                        <>
                          {isSmall ? (
                            (() => {
                              const letters1 = Math.min(50, (customization.resinName1 || '').replace(/\s+/g, '').length);
                              const name1Cost = calcNameExtraCost(customization.resinName1);
                              return (
                                <div>Name (letters: {letters1}): ₹{name1Cost}</div>
                              );
                            })()
                          ) : (
                            (() => {
                              const letters1 = Math.min(50, (customization.resinName1 || '').replace(/\s+/g, '').length);
                              const letters2 = Math.min(50, (customization.resinName2 || '').replace(/\s+/g, '').length);
                              const name1Cost = calcNameExtraCost(customization.resinName1);
                              const name2Cost = calcNameExtraCost(customization.resinName2);
                              return (
                                <>
                                  {customization.resinName1 && <div>Name 1 (letters: {letters1}): ₹{name1Cost}</div>}
                                  {customization.resinName2 && <div>Name 2 (letters: {letters2}): ₹{name2Cost}</div>}
                                  <div>Extras Total: ₹{name1Cost + name2Cost}</div>
                                </>
                              );
                            })()
                          )}
                        </>
                      )}
                      <div><strong>Final Price: ₹{finalPrice}</strong></div>
                    </div>
                  </div>
                </div>
              );
            })()}
            {(() => {
              const productType = product.category?.toLowerCase() || product.type?.toLowerCase() || '';
              const isFrame = productType.includes('frame') && !productType.includes('resin');
              if (!isFrame) return null;
              const isSmall = (product?.id || '').toLowerCase().includes('small') || (product?.name || '').toLowerCase().includes('small');
              const sizeText = isSmall ? '8x15 inches' : '13x19 inches';
              const maxPhotos = 10;
              const idOrNameRender = ((product?.id || '') + ' ' + (product?.name || '')).toLowerCase();
              const idRawR = (product?.id || '').toLowerCase();
              const variant = frameVariant || (idOrNameRender.includes('custom') ? 'custom' : ((idRawR.includes('1-200set') || idRawR.includes('1-500set') || idRawR.includes('small1') || idRawR.includes('small2') || idRawR.includes('big2')) ? product.id : (isSmall ? 'small1_1note_1name' : 'big1_1-200set_2notes_2names')));
              const extraCost = variant === 'custom'
                ? ((customization.customNames || []).reduce((sum, n) => sum + calcNameExtraCost(n), 0)
                   + ( (customization.customNotes || []).reduce((sum, note) => sum + (note?.currency ? getNotePrice(note.currency) : 0), 0) ))
                : (variant.includes('2names')
                  ? (calcNameExtraCost(customization.frameName1) + calcNameExtraCost(customization.frameName2))
                  : calcNameExtraCost(customization.frameName1));
              const finalPrice = Number(product.price) + extraCost;
              return (
                <div className="frame-section">
                  {/* Frame size info */}
                  <div className="form-group">
                    <div className="form-static">Size: {sizeText}</div>
                  </div>
                  {/* Friendly frame type label (no selection buttons) */}
                  <div className="form-group">
                    <div className="form-static">
                      Frame Type: {
                        (() => {
                          if (variant === 'custom') return 'Custom';
                          if (isSmall) {
                            if (variant === 'small1_1note_1name') return 'Small (Type 1)';
                            if (variant === 'small2_2notes_2names') return 'Small (Type 2)';
                            return 'Small';
                          } else {
                            if (variant === 'big1_1-200set_2notes_2names') return 'Big (Type 1)';
                            if (variant === 'big1_1-500set_2notes_2names') return 'Big (Type 2)';
                            if (variant === 'big2_1-500set_2notes_2names') return 'Big (Type 2)';
                            return 'Big';
                          }
                        })()
                      }
                    </div>
                  </div>

                  {/* Conditional inputs by variant */}
                  {variant === 'custom' && (
                    <>
                      {/* Custom: only Names and Notes controls */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label>Names</label>
                          <button type="button" className="btn btn-outline" onClick={addCustomName}>Add Name</button>
                        </div>
                        {(customization.customNames || []).map((nm, i) => {
                          const letters = Math.min(50, (nm || '').replace(/\s+/g, '').length);
                          const cost = calcNameExtraCost(nm);
                          return (
                            <div key={`cname-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginTop: '8px' }}>
                              <input
                                type="text"
                                value={nm}
                                onChange={(e) => updateCustomName(i, e.target.value)}
                                className="form-input"
                                placeholder={`Name ${i + 1}`}
                                maxLength={50}
                              />
                              <button type="button" className="btn btn-outline" onClick={() => removeCustomName(i)}>Remove</button>
                              {nm && (
                                <div style={{ gridColumn: '1 / -1', fontSize: '0.85rem', color: '#555' }}>
                                  Letters: {letters} — ₹{cost}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Dynamic Notes */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label>Notes (min 3)</label>
                          <button type="button" className="btn btn-outline" onClick={addCustomNote}>Add Note</button>
                        </div>
                        {(customization.customNotes || []).map((note, i) => (
                          <div key={`cnote-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginTop: '8px' }}>
                            <input
                              type="date"
                              value={note?.date || ''}
                              onChange={(e) => updateCustomNote(i, 'date', e.target.value)}
                              className="form-input"
                            />
                            <select
                              value={note?.currency || ''}
                              onChange={(e) => updateCustomNote(i, 'currency', e.target.value)}
                              className="form-input"
                            >
                              <option value="">Currency</option>
                              {[1,5,10,20,50,100,200,500].map((v) => (
                                <option key={v} value={String(v)}>{v}</option>
                              ))}
                            </select>
                            <button type="button" className="btn btn-outline" onClick={() => removeCustomNote(i)}>Remove</button>
                          </div>
                        ))}
                        <small className="helper-text">Add at least 3 notes with both Date and Currency.</small>
                      </div>
                    </>
                  )}
                  {variant.startsWith('small1') && (
                    <>
                      <div className="form-group">
                        <label htmlFor="frameName1">Name *</label>
                        <input
                          type="text"
                          id="frameName1"
                          value={customization.frameName1}
                          onChange={(e) => handleInputChange('frameName1', e.target.value)}
                          className="form-input"
                          maxLength={50}
                          required
                        />
                        <small className="helper-text">
                          • Names up to 10 letters: ₹45 flat rate<br/>
                          • Names over 10 letters: ₹40 per letter (maximum 50 letters)
                        </small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="frameEvent">Event *</label>
                        <select
                          id="frameEvent"
                          value={customization.frameEvent}
                          onChange={(e) => handleInputChange('frameEvent', e.target.value)}
                          className="form-input"
                          required
                        >
                          <option value="">-- Select an Event --</option>
                          <option value="Anniversary">Anniversary</option>
                          <option value="Wedding">Wedding</option>
                          <option value="Birthday">Birthday</option>
                          <option value="House Warming Ceremony">House Warming Ceremony</option>
                          <option value="Retirement">Retirement</option>
                          <option value="Other">Other</option>
                        </select>
                        {customization.frameEvent === 'Other' && (
                          <input
                            type="text"
                            value={customization.frameEventOther}
                            onChange={(e) => handleInputChange('frameEventOther', e.target.value)}
                            placeholder="Please specify the event"
                            className="form-input"
                            style={{ marginTop: '10px' }}
                            required
                          />
                        )}
                      </div>
                      <div className="form-group">
                        <label htmlFor="frameEventDate">Event Date *</label>
                        <input
                          type="date"
                          id="frameEventDate"
                          value={customization.frameEventDate}
                          onChange={(e) => handleInputChange('frameEventDate', e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                    </>
                  )}

                  {variant.startsWith('small2') && (
                    <>
                      <div className="form-group">
                        <label htmlFor="frameName1">Name 1 *</label>
                        <input
                          type="text"
                          id="frameName1"
                          value={customization.frameName1}
                          onChange={(e) => handleInputChange('frameName1', e.target.value)}
                          className="form-input"
                          maxLength={50}
                          required
                        />
                        <small className="helper-text">Name pricing: Up to 10 letters ₹45 per letter, over 10 letters ₹40 per letter (50 letters max).</small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="frameDate1">Date 1 *</label>
                        <input
                          type="date"
                          id="frameDate1"
                          value={customization.frameDate1}
                          onChange={(e) => handleInputChange('frameDate1', e.target.value)}
                          className="form-input"
                          required
                        />
                        <small className="helper-text">Enter date for: {customization.frameName1 || 'Name 1'}</small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="frameName2">Name 2 *</label>
                        <input
                          type="text"
                          id="frameName2"
                          value={customization.frameName2}
                          onChange={(e) => handleInputChange('frameName2', e.target.value)}
                          className="form-input"
                          maxLength={50}
                          required
                        />
                        <small className="helper-text">Name pricing: Up to 10 letters ₹45 per letter, over 10 letters ₹40 per letter (50 letters max).</small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="frameDate2">Date 2 *</label>
                        <input
                          type="date"
                          id="frameDate2"
                          value={customization.frameDate2}
                          onChange={(e) => handleInputChange('frameDate2', e.target.value)}
                          className="form-input"
                          required
                        />
                        <small className="helper-text">Enter date for: {customization.frameName2 || 'Name 2'}</small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="frameEvent">Event *</label>
                        <select
                          id="frameEvent"
                          value={customization.frameEvent}
                          onChange={(e) => handleInputChange('frameEvent', e.target.value)}
                          className="form-input"
                          required
                        >
                          <option value="">-- Select an Event --</option>
                          <option value="Anniversary">Anniversary</option>
                          <option value="Wedding">Wedding</option>
                          <option value="Birthday">Birthday</option>
                          <option value="House Warming Ceremony">House Warming Ceremony</option>
                          <option value="Retirement">Retirement</option>
                          <option value="Other">Other</option>
                        </select>
                        {customization.frameEvent === 'Other' && (
                          <input
                            type="text"
                            value={customization.frameEventOther}
                            onChange={(e) => handleInputChange('frameEventOther', e.target.value)}
                            placeholder="Please specify the event"
                            className="form-input"
                            style={{ marginTop: '10px' }}
                            required
                          />
                        )}
                      </div>
                    </>
                  )}

                  {variant.startsWith('big') && (
                    <>
                      {!isSmall && (
                        <div className="form-group">
                          <div className="form-static">Set: {getSetFromVariant(variant)}</div>
                          {(() => {
                            const setLabel = getSetFromVariant(variant);
                            const denomText = setLabel === '1-500'
                              ? '1, 5, 10, 20, 50, 100, 200, 500'
                              : '1, 5, 10, 20, 50, 100, 200';
                            return (
                              <div
                                style={{
                                  marginTop: '6px',
                                  padding: '8px 10px',
                                  background: '#fff0f6',
                                  border: '1px dashed #d63384',
                                  color: '#d63384',
                                  borderRadius: '6px',
                                  fontSize: '0.9rem'
                                }}
                              >
                                Notes covered in this set: {denomText}. Includes Event Date.
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      <div className="form-group">
                        <label htmlFor="frameEvent">Event *</label>
                        <select
                          id="frameEvent"
                          value={customization.frameEvent}
                          onChange={(e) => handleInputChange('frameEvent', e.target.value)}
                          className="form-input"
                          required
                        >
                          <option value="">-- Select an Event --</option>
                          <option value="Anniversary">Anniversary</option>
                          <option value="Wedding">Wedding</option>
                          <option value="Birthday">Birthday</option>
                          <option value="House Warming Ceremony">House Warming Ceremony</option>
                          <option value="Retirement">Retirement</option>
                          <option value="Other">Other</option>
                        </select>
                        {customization.frameEvent === 'Other' && (
                          <input
                            type="text"
                            value={customization.frameEventOther}
                            onChange={(e) => handleInputChange('frameEventOther', e.target.value)}
                            placeholder="Please specify the event"
                            className="form-input"
                            style={{ marginTop: '10px' }}
                            required
                          />
                        )}
                      </div>
                      <div className="form-group">
                        <label htmlFor="frameEventDate">Event Date *</label>
                        <input
                          type="date"
                          id="frameEventDate"
                          value={customization.frameEventDate}
                          onChange={(e) => handleInputChange('frameEventDate', e.target.value)}
                          className="form-input"
                          required
                        />
                        <small className="helper-text">Event and Event Date will appear in the set.</small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="frameName1">Name 1 *</label>
                        <input
                          type="text"
                          id="frameName1"
                          value={customization.frameName1}
                          onChange={(e) => handleInputChange('frameName1', e.target.value)}
                          className="form-input"
                          maxLength={50}
                          required
                        />
                        <small className="helper-text">Name pricing: Up to 10 letters ₹45 per letter, over 10 letters ₹40 per letter (50 letters max).</small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="frameDate1">Date 1 *</label>
                        <input
                          type="date"
                          id="frameDate1"
                          value={customization.frameDate1}
                          onChange={(e) => handleInputChange('frameDate1', e.target.value)}
                          className="form-input"
                          required
                        />
                        <small className="helper-text">Enter date for: {customization.frameName1 || 'Name 1'}</small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="frameName2">Name 2 *</label>
                        <input
                          type="text"
                          id="frameName2"
                          value={customization.frameName2}
                          onChange={(e) => handleInputChange('frameName2', e.target.value)}
                          className="form-input"
                          maxLength={50}
                          required
                        />
                        <small className="helper-text">Name pricing: Up to 10 letters ₹45 per letter, over 10 letters ₹40 per letter (50 letters max).</small>
                      </div>
                      <div className="form-group">
                        <label htmlFor="frameDate2">Date 2 *</label>
                        <input
                          type="date"
                          id="frameDate2"
                          value={customization.frameDate2}
                          onChange={(e) => handleInputChange('frameDate2', e.target.value)}
                          className="form-input"
                          required
                        />
                        <small className="helper-text">Enter date for: {customization.frameName2 || 'Name 2'}</small>
                      </div>
                      {/* Set info moved to top of big frame section */}
                    </>
                  )}

                  {/* Frames image upload (up to 10) */}
                  <div className="form-group">
                    <label htmlFor="frameImages">Upload Photos (up to {maxPhotos})</label>
                    <input
                      type="file"
                      id="frameImages"
                      onChange={handleImageChange}
                      accept="image/*"
                      multiple
                      required
                      className="form-input"
                    />
                    {imagePreviews && imagePreviews.length > 0 && (
                      <div className="image-preview-container">
                        <div className="image-preview-header">
                          <span className="image-counter">Selected Images ({imagePreviews.length})</span>
                          <button 
                            type="button" 
                            onClick={clearAllImages}
                            className="clear-all-btn"
                            title="Clear all images"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="image-preview" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                          {imagePreviews.map((src, idx) => (
                            <div key={idx} className="image-preview-item">
                              <img 
                                src={src} 
                                alt={`Preview ${idx+1}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="remove-image-btn"
                                title="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <div className="form-static">
                      <div><strong>Price Breakdown</strong></div>
                      <div>Base Price: ₹{Number(product.price)}</div>
                      {extraCost > 0 && (
                        <>
                          {variant === 'custom' ? (
                            (() => {
                              const nameItems = (customization.customNames || []).map((nm, i) => ({
                                letters: Math.min(50, (nm || '').replace(/\s+/g, '').length),
                                cost: calcNameExtraCost(nm)
                              }));
                              const noteItems = (customization.customNotes || [])
                                .map((note, i) => ({
                                  currency: note?.currency,
                                  cost: note?.currency ? getNotePrice(note.currency) : 0,
                                  index: i
                                }))
                                .filter(Boolean);
                              return (
                                <>
                                  {nameItems.map((it, i) => (
                                    <div key={`pbname-${i}`}>Name {i+1} (letters: {it.letters}): ₹{it.cost}</div>
                                  ))}
                                  {noteItems.map((it) => (
                                    <div key={`pbnote-${it.index}`}>Note {it.index + 1} (₹{it.currency}): ₹{it.cost}</div>
                                  ))}
                                  <div>Extras Total: ₹{[...nameItems, ...noteItems].reduce((s, x) => s + x.cost, 0)}</div>
                                </>
                              );
                            })()
                          ) : variant.startsWith('small1') ? (
                            (() => {
                              const letters1 = Math.min(50, (customization.frameName1 || '').replace(/\s+/g, '').length);
                              const name1Cost = calcNameExtraCost(customization.frameName1);
                              return (
                                <div>Name (letters: {letters1}): ₹{name1Cost}</div>
                              );
                            })()
                          ) : (
                            (() => {
                              const letters1 = Math.min(50, (customization.frameName1 || '').replace(/\s+/g, '').length);
                              const letters2 = Math.min(50, (customization.frameName2 || '').replace(/\s+/g, '').length);
                              const name1Cost = calcNameExtraCost(customization.frameName1);
                              const name2Cost = calcNameExtraCost(customization.frameName2);
                              return (
                                <>
                                  {customization.frameName1 && <div>Name 1 (letters: {letters1}): ₹{name1Cost}</div>}
                                  {customization.frameName2 && <div>Name 2 (letters: {letters2}): ₹{name2Cost}</div>}
                                  <div>Extras Total: ₹{name1Cost + name2Cost}</div>
                                </>
                              );
                            })()
                          )}
                        </>
                      )}
                      <div><strong>Final Price: ₹{finalPrice}</strong></div>
                    </div>
                  </div>
                </div>
              );
            })()}
            {(() => {
              const productType = product.category?.toLowerCase() || product.type?.toLowerCase() || '';
              const isZodiac = productType.includes('zodiac') || productType.includes('coin') || productType.includes('stamp');
              if (!isZodiac) return null;
              return (
                <div className="form-group">
                  <label htmlFor="zodiacSign">Zodiac Sign *</label>
                  <select
                    id="zodiacSign"
                    value={customization.zodiacSign}
                    onChange={(e) => handleInputChange('zodiacSign', e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="">-- Select your Zodiac Sign --</option>
                    <option value="Aries">Aries (Mar 21 - Apr 19)</option>
                    <option value="Taurus">Taurus (Apr 20 - May 20)</option>
                    <option value="Gemini">Gemini (May 21 - Jun 20)</option>
                    <option value="Cancer">Cancer (Jun 21 - Jul 22)</option>
                    <option value="Leo">Leo (Jul 23 - Aug 22)</option>
                    <option value="Virgo">Virgo (Aug 23 - Sep 22)</option>
                    <option value="Libra">Libra (Sep 23 - Oct 22)</option>
                    <option value="Scorpio">Scorpio (Oct 23 - Nov 21)</option>
                    <option value="Sagittarius">Sagittarius (Nov 22 - Dec 21)</option>
                    <option value="Capricorn">Capricorn (Dec 22 - Jan 19)</option>
                    <option value="Aquarius">Aquarius (Jan 20 - Feb 18)</option>
                    <option value="Pisces">Pisces (Feb 19 - Mar 20)</option>
                  </select>
                </div>
              );
            })()}
            {shouldShowField('specialData') && (
              <div className="form-group">
                <label htmlFor="specialData">{getFieldLabel('specialData')}</label>
                <input
                  type="date"
                  id="specialData"
                  value={customization.specialData}
                  onChange={(e) => handleInputChange('specialData', e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            )}

            {shouldShowField('names') && (
              <div className="form-group">
                <label htmlFor="names">{getFieldLabel('names')}</label>
                <input
                  type="text"
                  id="names"
                  value={customization.names}
                  onChange={(e) => handleInputChange('names', e.target.value)}
                  placeholder={getPlaceholderText('names')}
                  className="form-input"
                />
              </div>
            )}

            {shouldShowField('description') && (() => {
              const productType = product.category?.toLowerCase() || product.type?.toLowerCase() || '';
              const isCurrencyNote = productType.includes('currency') || productType.includes('note');

              if (isCurrencyNote) {
                return (
                  <div className="form-group">
                    <label htmlFor="event">Event *</label>
                    <select
                      id="event"
                      value={customization.event}
                      onChange={(e) => handleInputChange('event', e.target.value)}
                      className="form-input"
                      required
                    >
                      <option value="">-- Select an Event --</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Birthday">Birthday</option>
                      <option value="House Warming Ceremony">House Warming Ceremony</option>
                      <option value="Retirement">Retirement</option>
                      <option value="Other">Other</option>
                    </select>
                    {customization.event === 'Other' && (
                      <input
                        type="text"
                        value={customization.customEvent}
                        onChange={(e) => handleInputChange('customEvent', e.target.value)}
                        placeholder="Please specify the event"
                        className="form-input"
                        style={{ marginTop: '10px' }}
                        required
                      />
                    )}
                  </div>
                );
              } else {
                return (
                  <div className="form-group">
                    <label htmlFor="description">{getFieldLabel('description')}</label>
                    <textarea
                      id="description"
                      value={customization.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder={getPlaceholderText('description')}
                      className="form-textarea"
                      rows="3"
                    />
                  </div>
                );
              }
            })()}

            {/* Image upload - generic (kept for currency notes only) */}
            {shouldShowField('description') && shouldShowImageUpload() && (
              <div className="form-group">
                <label htmlFor="customImage">Upload Image</label>
                <input
                  type="file"
                  id="customImage"
                  onChange={handleImageChange}
                  accept="image/*"
                  multiple
                  className="form-input"
                />
                {imagePreviews && imagePreviews.length > 0 && (
                  <div className="image-preview-container">
                    <div className="image-preview-header">
                      <span className="image-counter">Selected Images ({imagePreviews.length})</span>
                      <button 
                        type="button" 
                        onClick={clearAllImages}
                        className="clear-all-btn"
                        title="Clear all images"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="image-preview" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                      {imagePreviews.map((src, idx) => (
                        <div key={idx} className="image-preview-item">
                          <img 
                            src={src} 
                            alt={`Preview ${idx+1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="remove-image-btn"
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={imageUploading || isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={imageUploading || isSubmitting}>
                {isSubmitting ? 'Submitting...' : (imageUploading ? 'Uploading...' : 'Add to Cart')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomizationModal;
