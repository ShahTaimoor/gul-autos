import React from 'react'

const CheckoutProduct = ({
  name,
  quantity,
  price ,
  image,
}) => {
  return (
    <div className="flex justify-between items-start p-4 rounded-lg bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Image Container */}
        <div className="relative flex-shrink-0">
          <img
            src={image}
            alt={name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border border-gray-200"
            loading="lazy"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
            {name}
          </h3>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span className="font-medium">Qty:</span>
              {quantity}
            </span>
          </div>
        </div>
      </div>


    </div>
  )
}

export default CheckoutProduct