'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Альтернативная ссылка на товар в другом магазине
 */
interface AlternativeLink {
  store: string      // Название магазина (noon, amazon.com и т.д.)
  url: string        // Ссылка на товар
  price?: string     // Цена (опционально)
  img?: string       // Изображение (опционально)
  matchScore?: number // Оценка соответствия при поиске
}

/**
 * Интерфейс товара в вишлисте
 */
interface WishlistItem {
  asin: string
  title: string
  price: string
  img: string
  url: string
  affiliate: string
  alternativeLinks?: AlternativeLink[]  // Дополнительные ссылки на товар
  comment?: string  // Комментарий к товару
  isManual?: boolean  // Флаг что товар добавлен вручную
}

/**
 * Интерфейс данных вишлиста
 */
interface Wishlist {
  id: string
  short_id: string
  custom_short_id?: string
  destination: string
  items: WishlistItem[]
  created_at: string
  updated_at: string
  require_name_for_reserve?: boolean // Требовать имя при резервировании
}

interface Props {
  wishlistId: string
}

/**
 * Компонент редактирования вишлиста
 * 
 * Функциональность:
 * - Редактирование названия вишлиста
 * - Просмотр списка товаров
 * - Редактирование полей товара (название, цена)
 * - Удаление товаров из вишлиста
 * - Удаление всего вишлиста
 */
export default function EditWishlist({ wishlistId }: Props) {
  const router = useRouter()
  
  // Состояния
  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Состояние для редактирования названия
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState('')
  
  // Состояние для параметров вишлиста
  const [requireNameForReserve, setRequireNameForReserve] = useState(false)
  const [customShortId, setCustomShortId] = useState('')
  const [validatingShortId, setValidatingShortId] = useState(false)
  const [shortIdError, setShortIdError] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  
  // Состояние для редактирования товаров
  const [tempItems, setTempItems] = useState<WishlistItem[]>([])
  const [changedItems, setChangedItems] = useState<Set<string>>(new Set()) // Отслеживание измененных товаров
  
  // Состояние для выбора изображений
  const [loadingImages, setLoadingImages] = useState<string | null>(null)
  const [alternativeImages, setAlternativeImages] = useState<{ [asin: string]: string[] }>({})

  // Состояние для поиска на Noon
  const [searchingNoon, setSearchingNoon] = useState<string | null>(null) // ASIN товара для которого ищем
  
  // Состояние для добавления новых товаров
  const [addingItems, setAddingItems] = useState(false)
  const [newItemsUrls, setNewItemsUrls] = useState('')
  const [addingItemsLoading, setAddingItemsLoading] = useState(false)

  // Состояние для ручного добавления товара
  const [showManualItemForm, setShowManualItemForm] = useState(false)
  const [manualItem, setManualItem] = useState({
    title: '',
    price: '',
    img: '',
    url: '',
    comment: ''
  })
  const [manualItemFileInput, setManualItemFileInput] = useState<File | null>(null)
  const [uploadingManualImage, setUploadingManualImage] = useState(false)

  // Состояние для редактирования ссылок товара
  const [editingUrl, setEditingUrl] = useState<string | null>(null)
  const [editUrlValue, setEditUrlValue] = useState('')

  // Состояние для редактирования комментариев
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [commentValue, setCommentValue] = useState('')

  /**
   * Загружаем вишлист при монтировании
   */
  useEffect(() => {
    loadWishlist()
  }, [wishlistId])

  /**
   * Загрузка данных вишлиста
   */
  const loadWishlist = async () => {
    try {
      // Загружаем профиль для получения username
      const profileResponse = await fetch('/api/profile')
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setUsername(profileData.username || '')
      }

      const response = await fetch(`/api/wishlists/${wishlistId}`)
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить вишлист')
      }
      
      const data = await response.json()
      setWishlist(data)
      setTitle(data.destination || '')
      setTempItems(data.items || [])
      setRequireNameForReserve(data.require_name_for_reserve || false)
      setCustomShortId(data.custom_short_id || '')
    } catch (error: any) {
      console.error('Error loading wishlist:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Валидация custom_short_id
   */
  const validateShortId = async (value: string) => {
    if (!value.trim()) {
      setShortIdError(null)
      return true
    }

    // Валидация формата
    if (!/^[a-zA-Z0-9_\-]{3,20}$/.test(value)) {
      setShortIdError('Может содержать буквы, цифры, подчеркивание и дефис (3-20 символов)')
      return false
    }

    // Проверка уникальности
    setValidatingShortId(true)
    try {
      const response = await fetch(`/api/wishlists/check-short-id?short_id=${value}&exclude=${wishlist?.id}`)
      const data = await response.json()
      
      if (!data.available) {
        setShortIdError('Этот адрес уже занят')
        setValidatingShortId(false)
        return false
      }
      
      setShortIdError(null)
      setValidatingShortId(false)
      return true
    } catch (error) {
      setShortIdError('Ошибка проверки')
      setValidatingShortId(false)
      return false
    }
  }

  const handleShortIdChange = async (value: string) => {
    setCustomShortId(value)
    await validateShortId(value)
  }

  /**
   * Генерирует публичную ссылку для вишлиста
   */
  const getPublicUrl = (): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const id = customShortId || wishlist?.short_id || wishlist?.id
    
    if (username && customShortId) {
      return `${baseUrl}/share/${username}/${customShortId}`
    }
    
    if (username) {
      return `${baseUrl}/share/${username}/${wishlist?.short_id || wishlist?.id}`
    }
    
    return `${baseUrl}/w/${id}`
  }

  /**
   * Сохранение изменений параметров вишлиста
   */
  const saveSettings = async () => {
    // Валидируем custom_short_id если он изменился
    if (customShortId !== (wishlist?.custom_short_id || '')) {
      const isValid = await validateShortId(customShortId)
      if (!isValid && customShortId.trim()) return
    }

    setSaving(true)
    try {
      const updateData: any = {
        require_name_for_reserve: requireNameForReserve 
      }

      if (customShortId !== (wishlist?.custom_short_id || '')) {
        updateData.custom_short_id = customShortId || null
      }

      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()
      console.log('API Response:', { status: response.status, data })

      if (!response.ok) {
        const errorMsg = data.error || data.message || data.details || 'Не удалось обновить настройки'
        console.error('API Error:', errorMsg)
        throw new Error(errorMsg)
      }

      const updatedWishlist = data.wishlist
      
      // Обновляем основной объект вишлиста
      setWishlist(updatedWishlist)
      
      // Обновляем локальные состояния чтобы отразить сохранённые значения
      setCustomShortId(updatedWishlist.custom_short_id || '')
      setRequireNameForReserve(updatedWishlist.require_name_for_reserve || false)
      
      setMessage({ type: 'success', text: 'Настройки обновлены!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  /**
   * Сохранение изменений названия
   */
  const saveTitle = async () => {
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Название не может быть пустым' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: title.trim() }),
      })

      if (!response.ok) {
        throw new Error('Не удалось обновить название')
      }

      const data = await response.json()
      setWishlist(data.wishlist)
      setEditingTitle(false)
      setMessage({ type: 'success', text: 'Название обновлено!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  /**
   * Сохранение изменений товаров
   */
  const saveItems = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: tempItems }),
      })

      if (!response.ok) {
        throw new Error('Не удалось обновить товары')
      }

      const data = await response.json()
      setWishlist(data.wishlist)
      setMessage({ type: 'success', text: 'Изменения сохранены!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  /**
   * Удаление товара
   */
  const deleteItem = async (asin: string) => {
    if (!confirm('Удалить этот товар из вишлиста?')) return

    const newItems = tempItems.filter(item => item.asin !== asin)
    setTempItems(newItems)
    
    // Сразу сохраняем в БД
    setSaving(true)
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems }),
      })

      if (!response.ok) {
        throw new Error('Не удалось удалить товар')
      }

      const data = await response.json()
      setWishlist(data.wishlist)
      setMessage({ type: 'success', text: 'Товар удален!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      // Восстанавливаем товар в случае ошибки
      setTempItems(wishlist?.items || [])
    } finally {
      setSaving(false)
    }
  }

  /**
   * Удаление всего вишлиста
   */
  const deleteWishlist = async () => {
    if (!confirm('Вы уверены? Вишлист будет удален безвозвратно!')) return

    setSaving(true)
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Не удалось удалить вишлист')
      }

      // Перенаправляем на dashboard
      router.push('/dashboard')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      setSaving(false)
    }
  }

  /**
   * Добавление новых товаров в вишлист
   */
  const addNewItems = async () => {
    const urls = newItemsUrls.split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0)

    if (urls.length === 0) {
      setMessage({ type: 'error', text: 'Добавьте хотя бы одну ссылку' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setAddingItemsLoading(true)
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}/add-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Не удалось добавить товары')
      }

      const data = await response.json()
      
      setMessage({ 
        type: 'success', 
        text: `Добавлено ${data.added_count} новых товаров, пропущено ${data.duplicates_count} дубликатов` 
      })
      setTimeout(() => setMessage(null), 5000)
      
      // Перезагружаем вишлист
      await loadWishlist()
      
      // Очищаем форму
      setNewItemsUrls('')
      setAddingItems(false)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setAddingItemsLoading(false)
    }
  }

  /**
   * Обновление поля товара во временном стейте
   */
  const updateItemField = (asin: string, field: keyof WishlistItem, value: string) => {
    setTempItems(prev =>
      prev.map(item =>
        item.asin === asin ? { ...item, [field]: value } : item
      )
    )
    // Отмечаем товар как измененный
    setChangedItems(prev => new Set(prev).add(asin))
  }

  /**
   * Сохранение всех изменений товаров
   */
  const saveAllItems = async () => {
    if (changedItems.size === 0) {
      setMessage({ type: 'error', text: 'Нет изменений для сохранения' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: tempItems }),
      })

      if (!response.ok) {
        throw new Error('Не удалось обновить товары')
      }

      const data = await response.json()
      setWishlist(data.wishlist)
      setChangedItems(new Set())
      setMessage({ type: 'success', text: 'Все изменения сохранены!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  /**
   * Загрузка альтернативных изображений
   */
  const loadAlternativeImages = async (asin: string, url: string) => {
    setLoadingImages(asin)
    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error('Не удалось загрузить изображения')
      }

      const data = await response.json()
      setAlternativeImages(prev => ({ ...prev, [asin]: data.images || [] }))
      
      if (data.images?.length === 0) {
        setMessage({ type: 'error', text: 'Альтернативные изображения не найдены' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error: any) {
      console.error('Error loading images:', error)
      setMessage({ type: 'error', text: 'Ошибка загрузки изображений' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setLoadingImages(null)
    }
  }

  /**
   * Выбор изображения
   */
  const selectImage = (asin: string, imageUrl: string) => {
    updateItemField(asin, 'img', imageUrl)
    // Удаляем альтернативные изображения после выбора
    setAlternativeImages(prev => {
      const newImages = { ...prev }
      delete newImages[asin]
      return newImages
    })
    setMessage({ type: 'success', text: 'Изображение выбрано! Не забудьте сохранить изменения' })
    setTimeout(() => setMessage(null), 3000)
  }

  /**
   * Поиск товара на noon.com
   */
  const searchNoonLink = async (asin: string, title: string, price: string) => {
    setSearchingNoon(asin)
    try {
      const response = await fetch('/api/search-noon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: title, amazonPrice: price }),
      })

      if (!response.ok) {
        throw new Error('Не удалось найти товар на noon.com')
      }

      const data = await response.json()
      
      if (data.success && data.product) {
        const matchScore = data.matchScore || 0
        
        // Добавляем ссылку на Noon к альтернативным ссылкам
        setTempItems(prev => prev.map(item => {
          if (item.asin === asin) {
            const alternativeLinks = item.alternativeLinks || []
            // Проверяем, нет ли уже ссылки на Noon
            const hasNoonLink = alternativeLinks.some(link => link.store === 'noon')
            
            if (hasNoonLink) {
              // Обновляем существующую ссылку
              return {
                ...item,
                alternativeLinks: alternativeLinks.map(link =>
                  link.store === 'noon'
                    ? { store: 'noon', url: data.product.url, price: data.product.price, img: data.product.img, matchScore }
                    : link
                )
              }
            } else {
              // Добавляем новую ссылку
              return {
                ...item,
                alternativeLinks: [
                  ...alternativeLinks,
                  { store: 'noon', url: data.product.url, price: data.product.price, img: data.product.img, matchScore }
                ]
              }
            }
          }
          return item
        }))
        
        // Отмечаем товар как измененный
        setChangedItems(prev => new Set(prev).add(asin))
        
        // Показываем сообщение с оценкой соответствия
        let messageText = `✓ На Noon найдено (совпадение: ${matchScore}%)`
        if (matchScore < 50) {
          messageText = `⚠️ На Noon найдено похожее (совпадение: ${matchScore}%) - проверьте товар!`
        }
        
        setMessage({ type: 'success', text: messageText })
        setTimeout(() => setMessage(null), 5000)
      } else {
        setMessage({ type: 'error', text: 'Товар не найден на noon.com или совпадение слишком низкое' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error: any) {
      console.error('Error searching Noon:', error)
      setMessage({ type: 'error', text: 'Ошибка поиска на noon.com' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setSearchingNoon(null)
    }
  }

  /**
   * Удаление альтернативной ссылки
   */
  const removeAlternativeLink = (asin: string, store: string) => {
    setTempItems(prev => prev.map(item => {
      if (item.asin === asin) {
        return {
          ...item,
          alternativeLinks: (item.alternativeLinks || []).filter(link => link.store !== store)
        }
      }
      return item
    }))
    setChangedItems(prev => new Set(prev).add(asin))
    setMessage({ type: 'success', text: 'Ссылка удалена! Не забудьте сохранить изменения' })
    setTimeout(() => setMessage(null), 3000)
  }

  /**
   * Обработка загрузки изображения для ручного товара
   */
  const handleManualImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingManualImage(true)
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setManualItem(prev => ({ ...prev, img: base64 }))
        setMessage({ type: 'success', text: 'Изображение загружено!' })
        setTimeout(() => setMessage(null), 3000)
      }
      reader.readAsDataURL(file)
    } finally {
      setUploadingManualImage(false)
    }
  }

  /**
   * Загрузка изображения по URL для ручного товара
   */
  const loadManualImageFromUrl = async () => {
    if (!manualItem.img.startsWith('http')) {
      setMessage({ type: 'error', text: 'Введите корректный URL изображения' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setUploadingManualImage(true)
    try {
      const response = await fetch(manualItem.img)
      const blob = await response.blob()
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setManualItem(prev => ({ ...prev, img: base64 }))
        setMessage({ type: 'success', text: 'Изображение загружено!' })
        setTimeout(() => setMessage(null), 3000)
      }
      reader.readAsDataURL(blob)
    } catch (error) {
      setMessage({ type: 'error', text: 'Не удалось загрузить изображение по URL' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setUploadingManualImage(false)
    }
  }

  /**
   * Добавление товара вручную
   */
  const addManualItem = async () => {
    if (!manualItem.title.trim()) {
      setMessage({ type: 'error', text: 'Укажите название товара' })
      return
    }

    if (!manualItem.url.trim()) {
      setMessage({ type: 'error', text: 'Укажите ссылку на товар' })
      return
    }

    // Генерируем уникальный ASIN для ручного товара
    const customAsin = `manual-${Date.now()}`

    const newItem: WishlistItem = {
      asin: customAsin,
      title: manualItem.title.trim(),
      price: manualItem.price.trim(),
      img: manualItem.img,
      url: manualItem.url.trim(),
      affiliate: manualItem.url,
      comment: manualItem.comment.trim(),
      isManual: true,
      alternativeLinks: []
    }

    setTempItems(prev => [...prev, newItem])
    setChangedItems(prev => new Set(prev).add(customAsin))

    // Сразу сохраняем
    setSaving(true)
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [...tempItems, newItem] }),
      })

      if (!response.ok) {
        throw new Error('Не удалось добавить товар')
      }

      const data = await response.json()
      setWishlist(data.wishlist)
      setTempItems(data.wishlist.items)
      
      setMessage({ type: 'success', text: 'Товар добавлен!' })
      setTimeout(() => setMessage(null), 3000)

      // Очищаем форму
      setManualItem({
        title: '',
        price: '',
        img: '',
        url: '',
        comment: ''
      })
      setShowManualItemForm(false)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      // Откатываем добавление в случае ошибки
      setTempItems(prev => prev.filter(item => item.asin !== customAsin))
    } finally {
      setSaving(false)
    }
  }

  /**
   * Сохранение отредактированной ссылки товара
   */
  const saveEditedUrl = async (asin: string) => {
    if (!editUrlValue.trim()) {
      setMessage({ type: 'error', text: 'Ссылка не может быть пустой' })
      return
    }

    setTempItems(prev => prev.map(item =>
      item.asin === asin 
        ? { ...item, url: editUrlValue.trim(), affiliate: editUrlValue.trim() }
        : item
    ))
    setChangedItems(prev => new Set(prev).add(asin))
    
    setEditingUrl(null)
    setMessage({ type: 'success', text: 'Ссылка обновлена! Не забудьте сохранить изменения' })
    setTimeout(() => setMessage(null), 3000)
  }

  /**
   * Сохранение комментария к товару
   */
  const saveComment = (asin: string) => {
    setTempItems(prev => prev.map(item =>
      item.asin === asin 
        ? { ...item, comment: commentValue.trim() || undefined }
        : item
    ))
    setChangedItems(prev => new Set(prev).add(asin))
    
    setEditingComment(null)
    setCommentValue('')
    setMessage({ type: 'success', text: 'Комментарий сохранен! Не забудьте сохранить товар' })
    setTimeout(() => setMessage(null), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl w-1/3"></div>
            <div className="h-96 bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !wishlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300 text-red-900 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-4xl text-white shadow-lg">
                ⚠️
              </div>
              <h2 className="text-3xl font-black">Ошибка загрузки</h2>
            </div>
            <p className="mb-6 text-lg">{error || 'Вишлист не найден'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition transform hover:scale-105"
            >
              ← Вернуться к списку
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Шапка */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="group flex items-center gap-2 text-indigo-700 hover:text-indigo-900 font-bold bg-white hover:bg-indigo-50 px-4 sm:px-6 py-3 rounded-2xl transition-all shadow-lg hover:shadow-xl border-2 border-indigo-100 hover:border-indigo-300 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start transform hover:scale-105"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            К списку
          </button>
          
          <button
            onClick={deleteWishlist}
            disabled={saving}
            className="px-4 sm:px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl transition-all disabled:opacity-50 font-bold shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>🗑️</span>
            Удалить вишлист
          </button>
        </div>

        {/* Сообщения */}
        {message && (
          <div
            className={`mb-6 p-5 rounded-2xl shadow-xl font-bold flex items-center gap-3 animate-shake ${
              message.type === 'success'
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 border-2 border-green-300'
                : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-900 border-2 border-red-300'
            }`}
          >
            <span className="text-2xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
            {message.text}
          </div>
        )}

        {/* Название вишлиста */}
        <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-gray-200 p-6 sm:p-8 mb-6 sm:mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                📝
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-800">Название вишлиста</h2>
            </div>
            {editingTitle ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-white text-gray-900 font-bold shadow-lg text-base sm:text-lg"
                  maxLength={100}
                />
                <button
                  onClick={saveTitle}
                  disabled={saving}
                  className="px-5 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl transition-all disabled:opacity-50 font-bold shadow-lg hover:shadow-xl text-sm sm:text-base transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>✓</span>
                  Сохранить
                </button>
                <button
                  onClick={() => {
                    setEditingTitle(false)
                    setTitle(wishlist.destination)
                  }}
                  disabled={saving}
                  className="px-5 sm:px-6 py-3 sm:py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-2xl transition-all disabled:opacity-50 font-bold shadow-lg text-sm sm:text-base transform hover:scale-105"
                >
                  ✕ Отмена
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent break-words w-full sm:w-auto">{wishlist.destination}</h1>
                <button
                  onClick={() => setEditingTitle(true)}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all font-bold text-sm sm:text-base whitespace-nowrap border-2 border-indigo-200 hover:border-indigo-300 shadow-md flex items-center gap-2"
                >
                  <span>✏️</span>
                  Редактировать
                </button>
              </div>
            )}
        
          <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
              <span className="text-2xl">🔑</span>
              <div>
                <p className="text-xs text-gray-600 font-medium">Короткий ID</p>
                <p className="font-mono font-bold text-indigo-700">{wishlist.short_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl border border-pink-200">
              <span className="text-2xl">📦</span>
              <div>
                <p className="text-xs text-gray-600 font-medium">Товаров</p>
                <p className="font-bold text-2xl bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">{tempItems.length}</p>
              </div>
            </div>
            <a
              href={getPublicUrl()}
              target="_blank"
              className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 hover:scale-105 transition-transform group"
            >
              <span className="text-2xl group-hover:rotate-12 transition-transform">🔗</span>
              <div>
                <p className="text-xs text-gray-600 font-medium">Публичная</p>
                <p className="font-bold text-green-700">Открыть →</p>
              </div>
            </a>
          </div>

          {/* Настройки резервирования */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-2xl shadow-lg">
                ⚙️
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-800">Настройки публичного доступа</h2>
            </div>
            
            <div className="space-y-4">
              {/* Custom short ID */}
              <div>
                <label htmlFor="custom_short_id" className="block text-sm font-semibold text-gray-800 mb-2">
                  🔗 Адрес вишлиста (опционально)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    id="custom_short_id"
                    value={customShortId}
                    onChange={(e) => setCustomShortId(e.target.value)}
                    placeholder={wishlist?.short_id || 'мой-вишлист'}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition bg-white text-gray-900 placeholder-gray-400 font-medium shadow-sm ${
                      shortIdError ? 'border-red-400' : 'border-blue-200'
                    }`}
                    pattern="^[a-zA-Z0-9_\-]{3,20}$"
                    maxLength={20}
                  />
                  {shortIdError && (
                    <p className="text-sm text-red-600 font-medium">⚠️ {shortIdError}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    💡 Публичная ссылка:{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded text-blue-600 font-mono">
                      {getPublicUrl()}
                    </code>
                  </p>
                </div>
              </div>

              {/* Требовать имя при резервировании */}
              <label className="flex items-start gap-4 p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-200 cursor-pointer hover:border-rose-300 transition-all">
                <input
                  type="checkbox"
                  checked={requireNameForReserve}
                  onChange={(e) => setRequireNameForReserve(e.target.checked)}
                  className="w-6 h-6 rounded-lg border-2 border-rose-300 cursor-pointer mt-1 flex-shrink-0 accent-rose-500"
                />
                <div className="flex-grow">
                  <p className="font-bold text-gray-900 text-base">Требовать имя при резервировании</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Если включить, гости должны указать свое имя при резервировании подарка. 
                    По умолчанию резервирование анонимное.
                  </p>
                </div>
              </label>
              
              {(requireNameForReserve !== (wishlist?.require_name_for_reserve || false) ||
                customShortId !== (wishlist?.custom_short_id || '')) && (
                <button
                  onClick={saveSettings}
                  disabled={saving || validatingShortId || (shortIdError && customShortId.trim() ? true : false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-2xl transition-all disabled:opacity-50 font-bold shadow-lg hover:shadow-xl text-base transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>💾</span>
                  Сохранить настройки
                </button>
              )}
            </div>
        </div>
      </div>
      </div>

      {/* Форма добавления новых товаров */}
      <div className="bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm rounded-3xl shadow-xl p-6 border-2 border-purple-200 mb-6">
        {!addingItems ? (
          <button
            onClick={() => setAddingItems(true)}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <span className="text-2xl">➕</span>
            Добавить товары в список
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <span>➕</span>
                Добавить товары
              </h3>
              <button
                onClick={() => {
                  setAddingItems(false)
                  setNewItemsUrls('')
                }}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                ✕
              </button>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <span>🔗</span>
                Ссылки Amazon (вишлисты или товары)
              </label>
              <textarea
                value={newItemsUrls}
                onChange={(e) => setNewItemsUrls(e.target.value)}
                placeholder="https://www.amazon.com/dp/B08N5WRWNW&#x0a;https://www.amazon.com/hz/wishlist/ls/...&#x0a;https://www.amazon.ae/dp/B0CX2LWHLL"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-900 font-medium bg-white shadow-sm font-mono text-sm resize-y min-h-[100px]"
                disabled={addingItemsLoading}
                rows={4}
              />
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                <span>💡</span>
                Каждая ссылка с новой строки. Дубликаты будут автоматически пропущены
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={addNewItems}
                disabled={addingItemsLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addingItemsLoading ? (
                  <>
                    <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Добавление...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Добавить товары</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setAddingItems(false)
                  setNewItemsUrls('')
                }}
                disabled={addingItemsLoading}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Форма ручного добавления товара */}
      <div className="bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm rounded-3xl shadow-xl p-6 border-2 border-blue-200 mb-6">
        {!showManualItemForm ? (
          <button
            onClick={() => setShowManualItemForm(true)}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <span className="text-2xl">✏️</span>
            Добавить товар вручную
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <span>✏️</span>
                Добавить товар вручную
              </h3>
              <button
                onClick={() => {
                  setShowManualItemForm(false)
                  setManualItem({ title: '', price: '', img: '', url: '', comment: '' })
                }}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                ✕
              </button>
            </div>
            
            {/* Название товара */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <span>📝</span>
                Название товара <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={manualItem.title}
                onChange={(e) => setManualItem(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Введите название товара"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-medium bg-white shadow-sm"
              />
            </div>

            {/* Цена */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <span>💰</span>
                Цена (опционально)
              </label>
              <input
                type="text"
                value={manualItem.price}
                onChange={(e) => setManualItem(prev => ({ ...prev, price: e.target.value }))}
                placeholder="например: 99.99 AED"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-medium bg-white shadow-sm"
              />
            </div>

            {/* Ссылка на товар */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <span>🔗</span>
                Ссылка на товар <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={manualItem.url}
                onChange={(e) => setManualItem(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://noon.com/... или https://amazon.com/dp/..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-medium bg-white shadow-sm"
              />
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                <span>💡</span>
                Ссылка на Noon, Amazon или любой другой магазин
              </p>
            </div>

            {/* Загрузка изображения */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <span>📸</span>
                Изображение товара (опционально)
              </label>
              
              {manualItem.img && (
                <div className="mb-3 relative">
                  <img
                    src={manualItem.img}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-xl shadow-lg"
                  />
                  <button
                    onClick={() => setManualItem(prev => ({ ...prev, img: '' }))}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-lg p-2 shadow-lg"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleManualImageUpload}
                    disabled={uploadingManualImage}
                    className="flex-1 px-4 py-3 border-2 border-dashed border-blue-300 rounded-xl text-gray-700 text-sm disabled:opacity-50"
                  />
                  <button
                    onClick={() => setManualItem(prev => ({ ...prev, img: manualItem.img || '' }))}
                    disabled={uploadingManualImage || !manualItem.img.startsWith('http')}
                    className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-bold text-sm transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    {uploadingManualImage ? '⏳' : '✓'}
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span>💡</span>
                  Загрузите файл с компьютера или вставьте ссылку и нажмите кнопку
                </p>
              </div>

              <div className="mt-2">
                <label className="text-xs font-bold text-gray-600 mb-1 block">или по ссылке:</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={manualItem.img}
                    onChange={(e) => setManualItem(prev => ({ ...prev, img: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-medium bg-white shadow-sm text-sm"
                  />
                  <button
                    onClick={loadManualImageFromUrl}
                    disabled={uploadingManualImage || !manualItem.img.startsWith('http')}
                    className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-md hover:shadow-lg whitespace-nowrap"
                  >
                    {uploadingManualImage ? '⏳' : '📥'}
                  </button>
                </div>
              </div>
            </div>

            {/* Комментарий */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <span>💬</span>
                Комментарий к товару (опционально)
              </label>
              <textarea
                value={manualItem.comment}
                onChange={(e) => setManualItem(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Пожелание по цвету, размеру, или другие комментарии..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-medium bg-white shadow-sm resize-none"
                rows={3}
              />
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                <span>💡</span>
                Комментарий будет виден в публичном списке
              </p>
            </div>

            {/* Кнопки действия */}
            <div className="flex gap-3">
              <button
                onClick={addManualItem}
                disabled={saving || uploadingManualImage}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Добавление...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Добавить товар</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowManualItemForm(false)
                  setManualItem({ title: '', price: '', img: '', url: '', comment: '' })
                }}
                disabled={saving}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Список товаров */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 border-2 border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
            🎁
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-800">Товары ({tempItems.length})</h2>
        </div>
        
        {tempItems.length === 0 ? (
          <div className="relative text-center py-16 sm:py-24 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="relative z-10">
              <div className="text-7xl mb-4 animate-bounce">📦</div>
              <p className="text-xl sm:text-2xl font-bold text-gray-700">Список товаров пуст</p>
              <p className="text-gray-600 mt-2">Добавьте товары через форму</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {tempItems.map((item) => (
              <div
                key={item.asin}
                className="group relative border-2 border-gray-200 hover:border-purple-300 rounded-2xl p-4 sm:p-5 hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative z-10 flex gap-4 flex-col sm:flex-row">
                  {/* Изображение */}
                  <div className="w-full sm:w-40 flex-shrink-0">
                    <div className="relative group/img">
                      {item.img ? (
                        <img
                          src={item.img}
                          alt={item.title}
                          className="w-full h-40 sm:h-full object-cover rounded-2xl shadow-lg group-hover/img:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-40 sm:h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center text-gray-400 text-4xl">
                          📦
                        </div>
                      )}
                    </div>
                    
                  </div>

                  {/* Информация */}
                  <div className="flex-1 min-w-0">
                    <div className="space-y-4">
                      {/* Галерея альтернативных изображений */}
                      {alternativeImages[item.asin] && alternativeImages[item.asin].length > 0 && (
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 shadow-inner">
                          <p className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                            <span>📸</span>
                            Выберите изображение ({alternativeImages[item.asin].length} доступно):
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {alternativeImages[item.asin].map((imgUrl, idx) => (
                              <button
                                key={idx}
                                onClick={() => selectImage(item.asin, imgUrl)}
                                className={`relative h-20 rounded-xl border-2 transition-all hover:scale-110 shadow-md ${
                                  item.img === imgUrl 
                                    ? 'border-purple-600 ring-4 ring-purple-400/50 scale-105' 
                                    : 'border-gray-300 hover:border-purple-400'
                                }`}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Option ${idx + 1}`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                                {item.img === imgUrl && (
                                  <div className="absolute inset-0 bg-purple-600/30 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-3xl drop-shadow-lg">✓</span>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                          <span>📝</span>
                          Название
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItemField(item.asin, 'title', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 text-sm text-gray-900 font-medium bg-white shadow-md"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                          <span>💰</span>
                          Цена
                        </label>
                        <input
                          type="text"
                          value={item.price}
                          onChange={(e) => updateItemField(item.asin, 'price', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 text-sm text-gray-900 font-medium bg-white shadow-md"
                        />
                      </div>

                      <div className="flex gap-2 text-xs sm:text-sm flex-wrap mb-3">
                        <div className="px-3 py-1.5 bg-gray-100 rounded-lg font-mono text-gray-700">
                          ASIN: {item.asin}
                        </div>
                        
                        {/* Основная ссылка с кнопкой редактирования */}
                        {editingUrl === item.asin ? (
                          <div className="flex gap-2 items-center flex-wrap w-full">
                            <input
                              type="url"
                              value={editUrlValue}
                              onChange={(e) => setEditUrlValue(e.target.value)}
                              className="flex-1 px-3 py-1.5 border-2 border-blue-400 rounded-lg text-gray-900 font-semibold text-xs bg-white focus:outline-none"
                              placeholder="https://..."
                            />
                            <button
                              onClick={() => saveEditedUrl(item.asin)}
                              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-xs transition-colors"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingUrl(null)}
                              className="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold text-xs transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <a
                              href={item.url}
                              target="_blank"
                              className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-semibold transition-colors flex items-center gap-1"
                            >
                              <span>🔗</span>
                              Ссылка
                            </a>
                            <button
                              onClick={() => {
                                setEditingUrl(item.asin)
                                setEditUrlValue(item.url)
                              }}
                              className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-semibold transition-colors flex items-center gap-1 text-xs"
                              title="Редактировать ссылку"
                            >
                              <span>✏️</span>
                            </button>
                          </div>
                        )}
                        
                        {/* Альтернативные ссылки */}
                        {item.alternativeLinks && item.alternativeLinks.map((link) => (
                          <div key={link.store} className="flex items-center gap-1">
                            <a
                              href={link.url}
                              target="_blank"
                              className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-semibold transition-colors flex items-center gap-1"
                            >
                              <span>🔗</span>
                              {link.store === 'noon' ? 'Noon' : link.store}
                              {link.price && <span className="text-xs">({link.price})</span>}
                            </a>
                            <button
                              onClick={() => removeAlternativeLink(item.asin, link.store)}
                              className="text-red-500 hover:text-red-700 text-xs"
                              title="Удалить ссылку"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        
                        {/* Кнопка поиска на Noon */}
                        {(!item.alternativeLinks || !item.alternativeLinks.some(l => l.store === 'noon')) && (
                          <button
                            onClick={() => searchNoonLink(item.asin, item.title, item.price)}
                            disabled={searchingNoon === item.asin}
                            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg font-semibold transition-colors flex items-center gap-1 border border-orange-200 disabled:opacity-50"
                          >
                            {searchingNoon === item.asin ? (
                              <>
                                <div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Поиск...</span>
                              </>
                            ) : (
                              <>
                                <span>🔍</span>
                                <span>Найти на Noon</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Комментарий к товару */}
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-2 text-sm font-bold text-amber-900">
                            <span>💬</span>
                            Комментарий
                          </label>
                          {!editingComment || editingComment !== item.asin ? (
                            <button
                              onClick={() => {
                                setEditingComment(item.asin)
                                setCommentValue(item.comment || '')
                              }}
                              className="text-xs px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded transition-colors"
                            >
                              ✏️ {item.comment ? 'Изменить' : 'Добавить'}
                            </button>
                          ) : null}
                        </div>
                        
                        {editingComment === item.asin ? (
                          <div className="space-y-2">
                            <textarea
                              value={commentValue}
                              onChange={(e) => setCommentValue(e.target.value)}
                              placeholder="Пожелание по цвету, размеру, или другие комментарии..."
                              className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg text-gray-900 font-medium text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveComment(item.asin)}
                                className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-xs transition-colors"
                              >
                                ✓ Сохранить
                              </button>
                              <button
                                onClick={() => {
                                  setEditingComment(null)
                                  setCommentValue('')
                                }}
                                className="px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold text-xs transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-amber-900 font-medium">
                            {item.comment || <span className="text-amber-600 italic">Нет комментариев</span>}
                          </p>
                        )}
                      </div>

                      {/* Кнопки действия для товара */}
                      {changedItems.has(item.asin) && (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={saveItems}
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg text-xs sm:text-sm font-bold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <span>✓</span>
                            Сохранить
                          </button>
                          <button
                            onClick={() => {
                              setTempItems(wishlist.items)
                              setChangedItems(new Set())
                              setAlternativeImages(prev => {
                                const newImages = { ...prev }
                                delete newImages[item.asin]
                                return newImages
                              })
                            }}
                            disabled={saving}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-lg transform hover:scale-105"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex sm:flex-col gap-2">
                    <button
                      onClick={() => loadAlternativeImages(item.asin, item.url)}
                      disabled={loadingImages === item.asin}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                      title="Загрузить альтернативные изображения"
                    >
                      {loadingImages === item.asin ? (
                        <>
                          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="hidden sm:inline text-xs">...</span>
                        </>
                      ) : (
                        <>
                          <span>🖼️</span>
                          <span className="hidden sm:inline text-xs">Фото</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteItem(item.asin)}
                      disabled={saving}
                      className="flex-1 sm:flex-none px-4 py-2 text-red-700 hover:bg-red-50 rounded-xl text-sm font-bold transition-all disabled:opacity-50 border-2 border-red-200 hover:border-red-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <span>🗑️</span>
                      <span className="hidden sm:inline text-xs">Удалить</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Save all changes button */}
            {changedItems.size > 0 && (
              <button
                onClick={() => saveAllItems()}
                disabled={saving}
                className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl text-base font-bold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Сохраняю...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Сохранить все изменения
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
