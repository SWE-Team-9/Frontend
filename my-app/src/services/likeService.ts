
export const likeTrack = async (trackId: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ success: true })
    }, 500)
  })
}

export const unlikeTrack = async (trackId: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true })
    }, 500)
  })
}