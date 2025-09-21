import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Plus } from 'lucide-react'

interface Option {
  id: string
  label: string
  subtitle?: string
  data?: any
}

interface AutocompleteInputProps {
  value: string
  onChange: (value: string, selectedOption?: Option) => void
  options: Option[]
  placeholder?: string
  onCreateNew?: (value: string) => void
  disabled?: boolean
  className?: string
}

export default function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder = 'Search...',
  onCreateNew,
  disabled = false,
  className = ''
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(value.toLowerCase()) ||
      (option.subtitle && option.subtitle.toLowerCase().includes(value.toLowerCase()))
    )
    setFilteredOptions(filtered)
    setHighlightedIndex(-1)
  }, [value, options])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        return
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const selectedOption = filteredOptions[highlightedIndex]
          onChange(selectedOption.label, selectedOption)
          setIsOpen(false)
        } else if (value && filteredOptions.length === 0 && onCreateNew) {
          onCreateNew(value)
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const handleOptionClick = (option: Option) => {
    onChange(option.label, option)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleCreateNew = () => {
    if (onCreateNew && value) {
      onCreateNew(value)
      setIsOpen(false)
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <ChevronDown 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" 
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.id}
                onClick={() => handleOptionClick(option)}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                  index === highlightedIndex ? 'bg-blue-50' : ''
                }`}
              >
                <div className="font-medium text-gray-900">{option.label}</div>
                {option.subtitle && (
                  <div className="text-sm text-gray-500">{option.subtitle}</div>
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500">
              {value ? (
                onCreateNew ? (
                  <div
                    onClick={handleCreateNew}
                    className="flex items-center cursor-pointer hover:bg-blue-50 text-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create "{value}"
                  </div>
                ) : (
                  'No matches found'
                )
              ) : (
                'Start typing to search...'
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}