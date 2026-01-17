import Swal from 'sweetalert2';

// Primary mixin for the premium theme
const PremiumSwal = Swal.mixin({
    customClass: {
        popup: 'rounded-4 shadow-lg border-0',
        title: 'font-kanit fw-bold text-dark',
        htmlContainer: 'font-kanit text-secondary',
        confirmButton: 'btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm mx-1',
        cancelButton: 'btn btn-light rounded-pill px-4 py-2 fw-bold border shadow-sm mx-1 text-muted',
        actions: 'gap-2'
    },
    buttonsStyling: false, // Disable default SweetAlert2 styling to use Bootstrap classes
    background: '#ffffff',
    color: '#333333',
    confirmButtonText: 'ตกลง',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true, // Cancel on left, Confirm on right usually feels better on web
});

export const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    return PremiumSwal.fire({
        title,
        text,
        icon,
        confirmButtonColor: '#FF6B35', // Fallback if css class fails, but we use btn-primary
    });
};

export const showConfirm = async (
    title: string,
    text: string,
    confirmButtonText: string = 'ยืนยัน',
    icon: 'warning' | 'question' = 'warning'
) => {
    const result = await PremiumSwal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText: 'ยกเลิก',
    });
    return result.isConfirmed;
};

export default PremiumSwal;
