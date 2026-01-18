'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
    value: string | number;
    label: string;
    icon?: React.ReactNode;
    description?: string;
}

interface CustomDropdownProps {
    value: string | number;
    options: DropdownOption[];
    onChange: (value: string) => void; // Changed to string to be generic, or match the usage
    placeholder?: string | React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
}

export default function CustomDropdown({
    value,
    options,
    onChange,
    placeholder = 'Select...',
    icon,
    className = ''
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (optionValue: string | number) => {
        onChange(optionValue.toString());
        setIsOpen(false);
    };

    return (
        <div className={`position-relative ${className}`} ref={dropdownRef} style={{ minWidth: '200px' }}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-100 d-flex align-items-center justify-content-between px-3 py-2 border-0 rounded-pill shadow-sm bg-white transition-all ${isOpen ? 'ring-2 ring-orange-400' : ''}`}
                style={{
                    transition: 'all 0.2s ease',
                    border: isOpen ? '2px solid #fd7e14' : '1px solid transparent' // Bootstrap orange-500 approx
                }}
            >
                <div className="d-flex align-items-center gap-2 text-dark truncate">
                    {icon && <span className="text-secondary">{icon}</span>}
                    <span className="fw-medium text-truncate">
                        {selectedOption ? (
                            <div className="d-flex align-items-center gap-2">
                                {selectedOption.icon}
                                <span>{selectedOption.label}</span>
                            </div>
                        ) : (
                            <span className="text-muted">{placeholder}</span>
                        )}
                    </span>
                </div>
                <ChevronDown
                    size={18}
                    className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="position-absolute start-0 end-0 mt-2 bg-white rounded-4 shadow-lg overflow-hidden border-0 z-3"
                        style={{ zIndex: 2000, maxHeight: '300px', overflowY: 'auto' }}
                    >
                        {/* Header/Title matches the trigger if needed, or just list */}
                        <div className="p-1">
                            {options.map((option) => {
                                const isSelected = option.value === value;
                                return (
                                    <div
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className={`d-flex align-items-center justify-content-between px-3 py-2 rounded-3 cursor-pointer ${isSelected ? 'bg-secondary bg-opacity-10' : 'hover-bg-light'}`}
                                        style={{ cursor: 'pointer', transition: 'background-color 0.1s' }}
                                        // Add hover effect via CSS class or inline style if needed. using standard bootstrap classes mostly.
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isSelected ? '' : '#f8f9fa'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? '' : 'transparent'}
                                    >
                                        <div className="d-flex align-items-center gap-2 text-dark">
                                            {option.icon && <div className="text-muted">{option.icon}</div>}
                                            <div>
                                                <div className={`fw-normal ${isSelected ? 'fw-bold text-orange-500' : ''}`} style={{ color: isSelected ? '#fd7e14' : 'inherit' }}>
                                                    {option.label}
                                                </div>
                                                {option.description && (
                                                    <div className="small text-muted" style={{ fontSize: '0.75rem' }}>{option.description}</div>
                                                )}
                                            </div>
                                        </div>
                                        {isSelected && <Check size={16} className="text-orange-500" style={{ color: '#fd7e14' }} />}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
